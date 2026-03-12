import { create } from 'zustand';
import type { Usuario } from '../types';

interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  usuario: Usuario;
}

interface AuthState {
  usuario: Usuario | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (payload: AuthPayload) => void;
  logout: () => void;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  usuario: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setAuth: ({ accessToken, refreshToken, usuario }) =>
    set({
      accessToken,
      refreshToken,
      usuario,
      isAuthenticated: true,
    }),

  logout: () =>
    set({
      accessToken: null,
      refreshToken: null,
      usuario: null,
      isAuthenticated: false,
    }),

  getToken: () => get().accessToken,
}));
