import api from './api';
import { useAuthStore } from '../store/authStore';
import type { TokenResponse } from '../types';

const authService = {
  async login(email: string, senha: string): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/login', { email, senha });
    const { access_token, refresh_token, usuario } = response.data;
    useAuthStore.getState().setAuth({
      accessToken: access_token,
      refreshToken: refresh_token,
      usuario,
    });
    return response.data;
  },

  async refresh(): Promise<TokenResponse> {
    const { refreshToken } = useAuthStore.getState();
    const response = await api.post<TokenResponse>('/auth/refresh', {
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
