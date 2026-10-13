import api from './api';

export interface Vehicle {
  _id: string;
  ownerId: string;
  registrationNumber: string;
  vin: string;
  engineNumber?: string;
  vehicleType: string;
  manufacturer: string;
  model: string;
  manufacturingYear: number;
  currentMileage: number;
  fuelType?: string;
  transmission?: string;
  color?: string;
  registrationJurisdiction?: string;
  lastServiceDate?: string | null;
  nextServiceMileage?: number | null;
  imageUrl?: string;
  status: 'Active' | 'In Service' | 'Archived';
  createdAt: string;
  updatedAt: string;
}

export interface GetVehiclesResponse {
  success: boolean;
  count: number;
  data: {
    vehicles: Vehicle[];
  };
}

export interface CreateVehiclePayload {
  registrationNumber: string;
  vin: string;
  engineNumber?: string;
  vehicleType?: string;
  manufacturer: string;
  model: string;
  manufacturingYear: number;
  currentMileage: number;
  fuelType?: string;
  transmission?: string;
  color?: string;
  registrationJurisdiction?: string;
  lastServiceDate?: string | null;
  nextServiceMileage?: number | null;
  imageUrl?: string;
  status?: 'Active' | 'In Service' | 'Archived';
}

export interface CreateVehicleResponse {
  success: boolean;
  message: string;
  data: {
    vehicle: Vehicle;
  };
}

export interface GetVehicleResponse {
  success: boolean;
  data: {
    vehicle: Vehicle;
  };
}

/**
 * Fetch all vehicles owned by the currently authenticated user
 * Uses existing Axios instance with automatic JWT Authorization header
 */
export const getMyVehicles = async (): Promise<Vehicle[]> => {
  const response = await api.get<GetVehiclesResponse>('/vehicles');
  return response.data?.data?.vehicles || [];
};

/**
 * Fetch a single vehicle passport by ID (owner tenant protected)
 * GET /api/vehicles/:id
 */
export const getVehicleById = async (id: string): Promise<Vehicle> => {
  const response = await api.get<GetVehicleResponse>(`/vehicles/${id}`);
  return response.data?.data?.vehicle;
};

/**
 * Register / Create a new Vehicle Digital Passport
 * Posts payload to POST /api/vehicles
 */
export const createVehicle = async (payload: CreateVehiclePayload): Promise<Vehicle> => {
  const response = await api.post<CreateVehicleResponse>('/vehicles', payload);
  return response.data?.data?.vehicle;
};

/**
 * Update vehicle passport details (owner tenant protected)
 * PATCH /api/vehicles/:id
 */
export const updateVehicle = async (
  id: string,
  payload: Partial<CreateVehiclePayload>
): Promise<Vehicle> => {
  const response = await api.patch<CreateVehicleResponse>(`/vehicles/${id}`, payload);
  return response.data?.data?.vehicle;
};

export default {
  getMyVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
};

