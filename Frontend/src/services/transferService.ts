import api from './api';

export type TransferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export interface TransferVehicleInfo {
  _id: string;
  registrationNumber: string;
  manufacturer: string;
  model: string;
  manufacturingYear?: number;
  imageUrl?: string;
  status?: string;
  currentMileage?: number;
  vin?: string;
  engineNumber?: string;
}

export interface TransferUserInfo {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
}

export interface TransferRequest {
  _id: string;
  vehicleId: TransferVehicleInfo | string;
  fromOwnerId: TransferUserInfo | string;
  toOwnerId?: TransferUserInfo | string | null;
  recipientEmail: string;
  recipientName: string;
  transferReason?: string;
  message?: string;
  status: TransferStatus;
  requestedAt: string;
  respondedAt?: string | null;
  completedAt?: string | null;
  verificationCodeHash?: string;
  verificationExpiresAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransferPayload {
  vehicleId: string;
  recipientEmail: string;
  recipientName?: string;
  transferReason?: string;
  message?: string;
  notes?: string;
}

export interface GetTransfersResponse {
  success: boolean;
  count: number;
  data: {
    transfers: TransferRequest[];
  };
}

export interface GetTransferResponse {
  success: boolean;
  data: {
    transferRequest: TransferRequest;
  };
}

export interface TransferMutationResponse {
  success: boolean;
  message: string;
  data: {
    transferRequest: TransferRequest;
    vehicle?: unknown;
  };
}

/**
 * Initiate a new vehicle ownership transfer request
 * POST /api/transfers
 */
export const createTransferRequest = async (
  payload: CreateTransferPayload
): Promise<TransferRequest> => {
  const response = await api.post<TransferMutationResponse>('/transfers', payload);
  return response.data?.data?.transferRequest;
};

/**
 * Fetch all outgoing transfer requests initiated by current user
 * GET /api/transfers/outgoing
 */
export const getOutgoingTransfers = async (): Promise<TransferRequest[]> => {
  const response = await api.get<GetTransfersResponse>('/transfers/outgoing');
  return response.data?.data?.transfers || [];
};

/**
 * Fetch all incoming transfer requests addressed to current user
 * GET /api/transfers/incoming
 */
export const getIncomingTransfers = async (): Promise<TransferRequest[]> => {
  const response = await api.get<GetTransfersResponse>('/transfers/incoming');
  return response.data?.data?.transfers || [];
};

/**
 * Fetch a single transfer request by ID
 * GET /api/transfers/:id
 */
export const getTransfer = async (id: string): Promise<TransferRequest> => {
  const response = await api.get<GetTransferResponse>(`/transfers/${id}`);
  return response.data?.data?.transferRequest;
};

/**
 * Accept transfer request and finalize vehicle ownership transfer
 * PATCH /api/transfers/:id/accept
 */
export const acceptTransfer = async (id: string): Promise<TransferRequest> => {
  const response = await api.patch<TransferMutationResponse>(`/transfers/${id}/accept`);
  return response.data?.data?.transferRequest;
};

/**
 * Reject transfer request
 * PATCH /api/transfers/:id/reject
 */
export const rejectTransfer = async (
  id: string,
  notes?: string
): Promise<TransferRequest> => {
  const response = await api.patch<TransferMutationResponse>(`/transfers/${id}/reject`, {
    notes,
  });
  return response.data?.data?.transferRequest;
};

/**
 * Cancel pending transfer request
 * PATCH /api/transfers/:id/cancel
 */
export const cancelTransfer = async (id: string): Promise<TransferRequest> => {
  const response = await api.patch<TransferMutationResponse>(`/transfers/${id}/cancel`);
  return response.data?.data?.transferRequest;
};

export default {
  createTransferRequest,
  getOutgoingTransfers,
  getIncomingTransfers,
  getTransfer,
  acceptTransfer,
  rejectTransfer,
  cancelTransfer,
};
