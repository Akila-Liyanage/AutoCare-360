import api from './api';

export interface AdminGarageItem {
  id: string;
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  workshopName: string;
  businessRegNumber: string;
  city: string;
  address: string;
  status: 'pending' | 'active' | 'suspended';
  createdAt: string;
  updatedAt?: string;
  verifiedAt?: string | null;
  verifiedBy?: {
    _id: string;
    fullName: string;
    email: string;
  } | null;
  rejectionReason?: string | null;
}

export interface AdminGaragesResponse {
  success: boolean;
  count: number;
  data: AdminGarageItem[];
}

export interface AdminGarageDetailResponse {
  success: boolean;
  data: AdminGarageItem;
}

export interface AdminGarageActionResponse {
  success: boolean;
  message: string;
  data: AdminGarageItem;
}

export const adminService = {
  // Get all garage accounts with optional status filtering & search
  getGarages: async (params?: { status?: string; search?: string }): Promise<AdminGarageItem[]> => {
    const res = await api.get<AdminGaragesResponse>('/admin/garages', { params });
    return res.data.data;
  },

  // Get single garage verification details
  getGarageById: async (id: string): Promise<AdminGarageItem> => {
    const res = await api.get<AdminGarageDetailResponse>(`/admin/garages/${id}`);
    return res.data.data;
  },

  // Approve a pending or suspended garage account
  approveGarage: async (id: string): Promise<AdminGarageItem> => {
    const res = await api.patch<AdminGarageActionResponse>(`/admin/garages/${id}/approve`);
    return res.data.data;
  },

  // Reject / suspend a garage account with reason
  rejectGarage: async (id: string, reason: string): Promise<AdminGarageItem> => {
    const res = await api.patch<AdminGarageActionResponse>(`/admin/garages/${id}/reject`, { reason });
    return res.data.data;
  },
};

export default adminService;
