/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService, {
  type UserProfile,
  type LoginPayload,
  type RegisterPayload,
  type AuthResponse,
} from '../services/authService';

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('autocare_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('autocare_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('autocare_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await authService.getMe();
        setUser(data.user);
        localStorage.setItem('autocare_user', JSON.stringify(data.user));
      } catch {
        // Token expired or invalid
        localStorage.removeItem('autocare_token');
        localStorage.removeItem('autocare_user');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await authService.login(payload);
    const { user: loggedInUser, token: authToken } = response.data;

    localStorage.setItem('autocare_token', authToken);
    localStorage.setItem('autocare_user', JSON.stringify(loggedInUser));

    setToken(authToken);
    setUser(loggedInUser);

    return response;
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await authService.register(payload);
    const { user: registeredUser, token: authToken } = response.data;

    localStorage.setItem('autocare_token', authToken);
    localStorage.setItem('autocare_user', JSON.stringify(registeredUser));

    setToken(authToken);
    setUser(registeredUser);

    return response;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
