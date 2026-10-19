import api from './api';

export interface BackendServiceRecord {
  _id: string;
  vehicleId: string;
  garageId?: string | null;
  garageName?: string;
  technicianName?: string;
  serviceDate: string;
  mileage: number;
  serviceType: string;
  workPerformed: string;
  partsReplaced: string[];
  labourCost: number;
  partsCost: number;
  totalCost: number;
  invoiceUrl?: string;
  serviceImages?: string[];
  recordSource: 'verified_garage' | 'self_reported';
  verificationStatus: 'verified' | 'pending' | 'self_reported';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetVehicleServiceRecordsResponse {
  success: boolean;
  count: number;
  data: {
    records: BackendServiceRecord[];
  };
}

export interface GetServiceRecordResponse {
  success: boolean;
  data: {
    serviceRecord: BackendServiceRecord;
  };
}

export interface CreateServiceRecordPayload {
  vehicleId: string;
  serviceDate: string;
  mileage: number;
  serviceType: string;
  workPerformed: string;
  partsReplaced?: string[];
  labourCost?: number;
  partsCost?: number;
  totalCost?: number;
  invoiceUrl?: string;
  serviceImages?: string[];
  garageName?: string;
  technicianName?: string;
  notes?: string;
}

export interface ServiceRecordMutationResponse {
  success: boolean;
  message: string;
  data: {
    serviceRecord: BackendServiceRecord;
  };
}

/**
 * Fetch all service and maintenance records for a specific vehicle
 * GET /api/vehicles/:vehicleId/services
 */
export const getVehicleServiceRecords = async (
  vehicleId: string
): Promise<BackendServiceRecord[]> => {
  const response = await api.get<GetVehicleServiceRecordsResponse>(
    `/vehicles/${vehicleId}/services`
  );
  return response.data?.data?.records || [];
};

/**
 * Fetch a single service record by ID
 * GET /api/services/:id
 */
export const getServiceRecord = async (
  id: string
): Promise<BackendServiceRecord> => {
  const response = await api.get<GetServiceRecordResponse>(`/services/${id}`);
  return response.data?.data?.serviceRecord;
};

/**
 * Create a new service record (Owner self-reported or Garage certified)
 * POST /api/services
 */
export const createServiceRecord = async (
  payload: CreateServiceRecordPayload
): Promise<BackendServiceRecord> => {
  const response = await api.post<ServiceRecordMutationResponse>(
    '/services',
    payload
  );
  return response.data?.data?.serviceRecord;
};

/**
 * Update an existing service record
 * PATCH /api/services/:id
 */
export const updateServiceRecord = async (
  id: string,
  payload: Partial<CreateServiceRecordPayload>
): Promise<BackendServiceRecord> => {
  const response = await api.patch<ServiceRecordMutationResponse>(
    `/services/${id}`,
    payload
  );
  return response.data?.data?.serviceRecord;
};

export default {
  getVehicleServiceRecords,
  getServiceRecord,
  createServiceRecord,
  updateServiceRecord,
};
