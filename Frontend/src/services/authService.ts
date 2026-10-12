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

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  devCode?: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  message: string;
  data: {
    resetToken: string;
  };
}

export interface ResetPasswordPayload {
  email: string;
  resetToken: string;
  newPassword: string;
}

export interface GeneralMessageResponse {
  success: boolean;
  message: string;
  devCode?: string;
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

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await api.post<ForgotPasswordResponse>('/auth/forgot-password', { email });
    return response.data;
  },

  async verifyCode(email: string, code: string): Promise<VerifyCodeResponse> {
    const response = await api.post<VerifyCodeResponse>('/auth/verify-code', { email, code });
    return response.data;
  },

  async resendCode(email: string): Promise<GeneralMessageResponse> {
    const response = await api.post<GeneralMessageResponse>('/auth/resend-code', { email });
    return response.data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<GeneralMessageResponse> {
    const response = await api.post<GeneralMessageResponse>('/auth/reset-password', payload);
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('autocare_token');
    localStorage.removeItem('autocare_user');
  },
};

export default authService;
