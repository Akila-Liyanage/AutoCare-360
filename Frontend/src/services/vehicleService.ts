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

/**
 * Fetch all vehicles owned by the currently authenticated user
 * Uses existing Axios instance with automatic JWT Authorization header
 */
export const getMyVehicles = async (): Promise<Vehicle[]> => {
  const response = await api.get<GetVehiclesResponse>('/vehicles');
  return response.data?.data?.vehicles || [];
};

export default {
  getMyVehicles,
};
