import api from './api';

export type GarageStatus = 'pending' | 'active' | 'suspended';

export interface GarageDocument {
  name: string;
  url: string;
  type?: string;
  uploadedAt?: string;
}

export interface VerificationMetadata {
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  reviewNotes?: string;
}

export interface AdminGarage {
  _id: string;
  id?: string;
  fullName: string;
  workshopName?: string;
  displayName?: string;
  email: string;
  phone: string;
  role: 'garage';
  status: GarageStatus;
  city?: string;
  country?: string;
  address?: string;
  businessRegNumber?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  documents?: GarageDocument[];
}

interface GetGaragesBackendResponse {
  success: boolean;
  count?: number;
  data?: {
    garages: AdminGarage[];
  };
  garages?: AdminGarage[];
}

interface GarageActionResponse {
  success: boolean;
  message?: string;
  data?: {
    garage: AdminGarage;
  };
}

/**
 * Fetch garages list with optional status filter and client-side/server-side search.
 * Backend endpoint: GET /api/admin/garages?status=...
 */
export const getGarages = async (
  status?: 'pending' | 'active' | 'suspended' | 'all',
  search?: string
): Promise<AdminGarage[]> => {
  const params: Record<string, string> = {};
  if (status && status !== 'all') {
    params.status = status;
  }
  if (search && search.trim()) {
    params.search = search.trim();
  }

  const response = await api.get<GetGaragesBackendResponse>('/admin/garages', { params });
  const rawList: AdminGarage[] =
    response.data?.data?.garages ||
    response.data?.garages ||
    [];

  // Client-side search fallback to ensure multi-field query works reliably
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    return rawList.filter((g) => {
      const name = (g.fullName || '').toLowerCase();
      const workshop = (g.workshopName || g.displayName || '').toLowerCase();
      const email = (g.email || '').toLowerCase();
      const phone = (g.phone || '').toLowerCase();
      const reg = (g.businessRegNumber || '').toLowerCase();
      const city = (g.city || '').toLowerCase();

      return (
        name.includes(q) ||
        workshop.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        reg.includes(q) ||
        city.includes(q)
      );
    });
  }

  return rawList;
};

/**
 * Fetch a single garage partner by ID.
 * Tries GET /api/admin/garages/:id; falls back to matching in list if singular route is not mounted.
 */
export const getGarageById = async (id: string): Promise<AdminGarage> => {
  try {
    const response = await api.get<{ success: boolean; data?: { garage: AdminGarage }; garage?: AdminGarage } | AdminGarage>(
      `/admin/garages/${id}`
    );

    const data = response.data;
    if (data && typeof data === 'object') {
      if ('data' in data && data.data?.garage) {
        return data.data.garage;
      }
      if ('garage' in data && data.garage) {
        return data.garage;
      }
      if ('_id' in data) {
        return data as AdminGarage;
      }
    }
    throw new Error('Garage record not found in API response.');
  } catch (err: unknown) {
    // Graceful fallback to find within all garages
    try {
      const allGarages = await getGarages('all');
      const found = allGarages.find((g) => g._id === id || g.id === id);
      if (found) return found;
    } catch {
      // Ignore fallback list error and rethrow primary error
    }
    throw err instanceof Error ? err : new Error('Failed to retrieve garage details.');
  }
};

/**
 * Approve a pending garage partner.
 * Calls PATCH /api/admin/garages/:id/approve with fallback to /verify or /status.
 */
export const approveGarage = async (id: string): Promise<GarageActionResponse> => {
  try {
    const response = await api.patch<GarageActionResponse>(`/admin/garages/${id}/approve`);
    return response.data;
  } catch {
    try {
      const response = await api.patch<GarageActionResponse>(`/admin/garages/${id}/verify`);
      return response.data;
    } catch {
      const response = await api.patch<GarageActionResponse>(`/admin/garages/${id}/status`, {
        status: 'active',
      });
      return response.data;
    }
  }
};

/**
 * Reject or suspend a garage partner with a mandatory justification reason.
 * Calls PATCH /api/admin/garages/:id/reject with fallback to /status.
 */
export const rejectGarage = async (id: string, reason: string): Promise<GarageActionResponse> => {
  const trimmedReason = reason.trim();
  if (!trimmedReason || trimmedReason.length < 5) {
    throw new Error('A detailed reason (at least 5 characters) is required to reject or suspend a garage partner.');
  }

  try {
    const response = await api.patch<GarageActionResponse>(`/admin/garages/${id}/reject`, {
      reason: trimmedReason,
    });
    return response.data;
  } catch {
    const response = await api.patch<GarageActionResponse>(`/admin/garages/${id}/status`, {
      status: 'suspended',
      reason: trimmedReason,
      rejectionReason: trimmedReason,
    });
    return response.data;
  }
};

const adminService = {
  getGarages,
  getGarageById,
  approveGarage,
  rejectGarage,
};

export default adminService;
