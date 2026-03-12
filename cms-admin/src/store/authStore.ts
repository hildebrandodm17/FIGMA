import { create } from 'zustand';
import type { Usuario } from '../types';

interface AuthState {
  usuario: Usuario | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setAuth: (token: string, usuario: Usuario) => void;
  logout: () => void;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  usuario: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: (token, usuario) =>
    set({
      accessToken: token,
      usuario,
      isAuthenticated: true,
    }),

  logout: () =>
    set({
      accessToken: null,
      usuario: null,
      isAuthenticated: false,
    }),

  getToken: () => get().accessToken,
}));
