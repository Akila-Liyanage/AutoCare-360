import api from './api';

export type QRSharePermissionLevel = 'full' | 'limited' | 'selected';
export type QRShareStatus = 'active' | 'revoked' | 'expired';

export interface QRShareVehicleInfo {
  _id: string;
  registrationNumber: string;
  manufacturer: string;
  model: string;
  manufacturingYear?: number;
  imageUrl?: string;
  status?: string;
  currentMileage?: number;
}

export interface QRShare {
  _id: string;
  vehicleId: QRShareVehicleInfo | string;
  ownerId: string;
  purpose?: string;
  permissionLevel: QRSharePermissionLevel;
  allowedSections?: string[];
  expiresAt: string;
  status: QRShareStatus;
  maxScans?: number | null;
  scanCount: number;
  lastScannedAt?: string | null;
  qrLabel?: string;
  recipientName?: string;
  createdBy: string;
  revokedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQRSharePayload {
  vehicleId: string;
  purpose?: string;
  permissionLevel: QRSharePermissionLevel;
  allowedSections?: string[];
  expiresAt: string;
  maxScans?: number | null;
  qrLabel?: string;
  recipientName?: string;
  notes?: string;
}

export interface CreateQRShareResponseData {
  qrShare: QRShare;
  rawToken: string;
}

export interface CreateQRShareResponse {
  success: boolean;
  message: string;
  data: CreateQRShareResponseData;
}

export interface GetQRSharesResponse {
  success: boolean;
  count: number;
  data: {
    qrShares: QRShare[];
  };
}

export interface GetQRShareResponse {
  success: boolean;
  data: {
    qrShare: QRShare;
  };
}

export interface QRShareActionResponse {
  success: boolean;
  message: string;
  data?: {
    qrShare?: QRShare;
  };
}

export interface QRShareFilter {
  vehicleId?: string;
  status?: QRShareStatus;
}

/**
 * Generate a new secure vehicle QR share
 * POST /api/qr-shares
 * Returns both the created qrShare document and one-time rawToken
 */
export const createQRShare = async (
  payload: CreateQRSharePayload
): Promise<CreateQRShareResponseData> => {
  const response = await api.post<CreateQRShareResponse>('/qr-shares', payload);
  return response.data.data;
};

/**
 * Fetch all QR shares created by the current owner (with optional filters)
 * GET /api/qr-shares
 */
export const getQRShares = async (
  filters?: QRShareFilter
): Promise<QRShare[]> => {
  const response = await api.get<GetQRSharesResponse>('/qr-shares', {
    params: filters,
  });
  return response.data?.data?.qrShares || [];
};

/**
 * Fetch a single QR share by ID
 * GET /api/qr-shares/:id
 */
export const getQRShare = async (id: string): Promise<QRShare> => {
  const response = await api.get<GetQRShareResponse>(`/qr-shares/${id}`);
  return response.data.data.qrShare;
};

/**
 * Revoke an active QR share
 * PATCH /api/qr-shares/:id/revoke
 */
export const revokeQRShare = async (id: string): Promise<QRShare> => {
  const response = await api.patch<QRShareActionResponse>(`/qr-shares/${id}/revoke`);
  return response.data?.data?.qrShare as QRShare;
};

/**
 * Delete a revoked or expired QR share
 * DELETE /api/qr-shares/:id
 */
export const deleteQRShare = async (id: string): Promise<void> => {
  await api.delete<QRShareActionResponse>(`/qr-shares/${id}`);
};

export default {
  createQRShare,
  getQRShares,
  getQRShare,
  revokeQRShare,
  deleteQRShare,
};
