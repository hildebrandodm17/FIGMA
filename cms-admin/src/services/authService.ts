import api from './api';
import { useAuthStore } from '../store/authStore';
import type { LoginRequest, AuthResponse } from '../types';

const authService = {
  async login(email: string, senha: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', { email, senha });
    const { access_token, refresh_token, usuario } = response.data;
    useAuthStore.getState().setAuth({
      accessToken: access_token,
      refreshToken: refresh_token,
      usuario,
    });
    return response.data;
  },

  async refresh(): Promise<AuthResponse> {
    const { refreshToken } = useAuthStore.getState();
    const response = await api.post<AuthResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    const { access_token, refresh_token, usuario } = response.data;
    useAuthStore.getState().setAuth({
      accessToken: access_token,
      refreshToken: refresh_token,
      usuario,
    });
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      useAuthStore.getState().logout();
    }
  },
};

export default authService;
