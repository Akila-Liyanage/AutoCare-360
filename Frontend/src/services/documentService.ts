import api from './api';

export interface BackendVehicleDocument {
  _id: string;
  vehicleId: string;
  ownerId: string;
  documentType: string;
  title: string;
  description?: string;
  fileName: string;
  originalName?: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
  issueDate?: string | null;
  expiryDate?: string | null;
  uploadedBy: string;
  source: 'owner_upload' | 'verified_garage';
  verificationStatus: 'self_reported' | 'pending' | 'verified';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetVehicleDocumentsResponse {
  success: boolean;
  count: number;
  data: {
    documents: BackendVehicleDocument[];
  };
}

export interface GetVehicleDocumentResponse {
  success: boolean;
  data: {
    document: BackendVehicleDocument;
  };
}

export interface DocumentMutationResponse {
  success: boolean;
  message: string;
  data: {
    document: BackendVehicleDocument;
  };
}

export interface DeleteDocumentResponse {
  success: boolean;
  message: string;
}

/**
 * Fetch all documents for a specific vehicle
 * GET /api/vehicles/:vehicleId/documents
 */
export const getVehicleDocuments = async (
  vehicleId: string
): Promise<BackendVehicleDocument[]> => {
  const response = await api.get<GetVehicleDocumentsResponse>(
    `/vehicles/${vehicleId}/documents`
  );
  return response.data?.data?.documents || [];
};

/**
 * Fetch a single vehicle document by ID
 * GET /api/documents/:id
 */
export const getVehicleDocument = async (
  id: string
): Promise<BackendVehicleDocument> => {
  const response = await api.get<GetVehicleDocumentResponse>(
    `/documents/${id}`
  );
  return response.data?.data?.document;
};

/**
 * Upload a new vehicle document with multipart/form-data
 * POST /api/vehicles/:vehicleId/documents
 */
export const uploadVehicleDocument = async (
  vehicleId: string,
  formData: FormData
): Promise<BackendVehicleDocument> => {
  const response = await api.post<DocumentMutationResponse>(
    `/vehicles/${vehicleId}/documents`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data?.data?.document;
};

/**
 * Update document metadata
 * PATCH /api/documents/:id
 */
export const updateVehicleDocument = async (
  id: string,
  payload: Partial<BackendVehicleDocument>
): Promise<BackendVehicleDocument> => {
  const response = await api.patch<DocumentMutationResponse>(
    `/documents/${id}`,
    payload
  );
  return response.data?.data?.document;
};

/**
 * Delete a vehicle document
 * DELETE /api/documents/:id
 */
export const deleteVehicleDocument = async (
  id: string
): Promise<DeleteDocumentResponse> => {
  const response = await api.delete<DeleteDocumentResponse>(
    `/documents/${id}`
  );
  return response.data;
};

export default {
  getVehicleDocuments,
  getVehicleDocument,
  uploadVehicleDocument,
  updateVehicleDocument,
  deleteVehicleDocument,
};
