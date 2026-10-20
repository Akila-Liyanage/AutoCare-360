import api from './api';

export type ShareLinkPermissionLevel = 'full' | 'limited' | 'selected';
export type ShareLinkStatus = 'active' | 'revoked' | 'expired';

export interface ShareLinkVehicleInfo {
  _id: string;
  registrationNumber: string;
  manufacturer: string;
  model: string;
  manufacturingYear?: number;
  imageUrl?: string;
  status?: string;
  currentMileage?: number;
}

export interface ShareLink {
  _id: string;
  vehicleId: ShareLinkVehicleInfo | string;
  ownerId: string;
  recipientName?: string;
  recipientEmail?: string;
  purpose?: string;
  permissionLevel: ShareLinkPermissionLevel;
  allowedSections?: string[];
  expiresAt: string;
  status: ShareLinkStatus;
  maxViews?: number | null;
  viewCount: number;
  lastAccessedAt?: string | null;
  createdBy: string;
  revokedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShareLinkPayload {
  vehicleId: string;
  recipientName?: string;
  recipientEmail?: string;
  purpose?: string;
  permissionLevel: ShareLinkPermissionLevel;
  allowedSections?: string[];
  expiresAt: string;
  maxViews?: number | null;
  notes?: string;
}

export interface CreateShareLinkResponseData {
  shareLink: ShareLink;
  rawToken: string;
}

export interface CreateShareLinkResponse {
  success: boolean;
  message: string;
  data: CreateShareLinkResponseData;
}

export interface GetShareLinksResponse {
  success: boolean;
  count: number;
  data: {
    shareLinks: ShareLink[];
  };
}

export interface GetShareLinkResponse {
  success: boolean;
  data: {
    shareLink: ShareLink;
  };
}

export interface ShareLinkActionResponse {
  success: boolean;
  message: string;
  data?: {
    shareLink?: ShareLink;
  };
}

export interface ShareLinkFilter {
  vehicleId?: string;
  status?: ShareLinkStatus;
}

/**
 * Generate a new secure vehicle share link
 * POST /api/share-links
 * Returns both the created shareLink and the one-time rawToken
 */
export const createShareLink = async (
  payload: CreateShareLinkPayload
): Promise<CreateShareLinkResponseData> => {
  const response = await api.post<CreateShareLinkResponse>('/share-links', payload);
  return response.data.data;
};

/**
 * Fetch all share links created by the current owner (with optional filters)
 * GET /api/share-links
 */
export const getShareLinks = async (
  filters?: ShareLinkFilter
): Promise<ShareLink[]> => {
  const response = await api.get<GetShareLinksResponse>('/share-links', {
    params: filters,
  });
  return response.data?.data?.shareLinks || [];
};

/**
 * Fetch a single share link by ID
 * GET /api/share-links/:id
 */
export const getShareLink = async (id: string): Promise<ShareLink> => {
  const response = await api.get<GetShareLinkResponse>(`/share-links/${id}`);
  return response.data.data.shareLink;
};

/**
 * Revoke an active share link
 * PATCH /api/share-links/:id/revoke
 */
export const revokeShareLink = async (id: string): Promise<ShareLink> => {
  const response = await api.patch<ShareLinkActionResponse>(`/share-links/${id}/revoke`);
  return response.data?.data?.shareLink as ShareLink;
};

/**
 * Delete a revoked or expired share link
 * DELETE /api/share-links/:id
 */
export const deleteShareLink = async (id: string): Promise<void> => {
  await api.delete<ShareLinkActionResponse>(`/share-links/${id}`);
};

export interface PublicSharedRecordData {
  shareSession: {
    id: string;
    permissionLevel: ShareLinkPermissionLevel;
    allowedSections?: string[];
    recipientName?: string;
    recipientEmail?: string;
    purpose?: string;
    expiresAt: string;
    viewCount: number;
  };
  vehicle: {
    _id: string;
    registrationNumber: string;
    vin: string;
    engineNumber?: string;
    manufacturer: string;
    model: string;
    manufacturingYear: number;
    vehicleType: string;
    currentMileage: number;
    fuelType?: string;
    transmission?: string;
    color?: string;
    registrationJurisdiction?: string;
    status: string;
    imageUrl?: string;
    ownerName?: string;
  };
  serviceRecords: Array<{
    _id: string;
    serviceDate: string;
    mileage: number;
    serviceType: string;
    workPerformed: string;
    garageName: string;
    technicianName?: string;
    recordSource?: string;
    verificationStatus?: string;
    cost?: number;
  }>;
  documents: Array<{
    _id: string;
    title: string;
    documentType: string;
    fileUrl?: string;
    fileName?: string;
    issueDate?: string;
    expiryDate?: string;
  }>;
  watermark: {
    recipientName: string;
    accessId: string;
    timestamp: string;
    expiresAt: string;
    purpose: string;
  };
  protection: {
    allowDownload: boolean;
    allowPrint: boolean;
    allowCopy: boolean;
    allowExport: boolean;
    watermarkRequired: boolean;
  };
  healthAssessment?: {
    trustScore: number;
    trustLevel: string;
    odometerIntegrity: string;
    anomalyDetected: boolean;
    verifiedChecks: string;
    lastServiceMileage: number;
  };
}

export interface PublicSharedRecordResponse {
  success: boolean;
  message: string;
  data: PublicSharedRecordData;
}

/**
 * Fetch public shared vehicle records using public secure token (BR-05, BR-06, BR-07, BR-08)
 * GET /api/share-links/public/:token
 */
export const getPublicSharedRecord = async (
  token: string
): Promise<PublicSharedRecordData> => {
  const response = await api.get<PublicSharedRecordResponse>(`/share-links/public/${token}`);
  return response.data.data;
};

export default {
  createShareLink,
  getShareLinks,
  getShareLink,
  revokeShareLink,
  deleteShareLink,
  getPublicSharedRecord,
};
