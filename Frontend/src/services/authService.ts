import api from './api';

export type UserRole = 'owner' | 'garage' | 'admin';

export interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'pending' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: 'owner' | 'garage';
}

export interface LoginPayload {
  email: string;
  password: string;
  role?: UserRole;
  selectedRole?: UserRole;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: UserProfile;
    token: string;
  };
}

export interface MeResponse {
  success: boolean;
  data: {
    user: UserProfile;
  };
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', payload);
    return response.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },

  async getMe(): Promise<MeResponse> {
    const response = await api.get<MeResponse>('/auth/me');
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('autocare_token');
    localStorage.removeItem('autocare_user');
  },
};

export default authService;
