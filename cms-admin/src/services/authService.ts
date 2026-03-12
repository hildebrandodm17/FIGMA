import api from './api';
import { useAuthStore } from '../store/authStore';

interface LoginResponse {
  access_token: string;
  token_type: string;
  expira_em: number;
  usuario: {
    id: string;
    nome: string;
    email: string;
    role: 'superadmin' | 'admin' | 'usuario';
    empresa_id?: string;
    empresa_nome?: string;
    permissoes: Record<string, string[]>;
  };
}

const authService = {
  async login(email: string, senha: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, senha });
    const tokenData = response.data.data as LoginResponse;
    useAuthStore.getState().setAuth({
      accessToken: tokenData.access_token,
      refreshToken: '',
      usuario: {
        ...tokenData.usuario,
        permissoes: tokenData.usuario.permissoes as any,
        ativo: true,
        created_at: '',
      },
    });
    return tokenData;
  },

  async refresh(): Promise<LoginResponse> {
    const response = await api.post('/auth/refresh');
    const tokenData = response.data.data as LoginResponse;
    useAuthStore.getState().setAuth({
      accessToken: tokenData.access_token,
      refreshToken: '',
      usuario: {
        ...tokenData.usuario,
        permissoes: tokenData.usuario.permissoes as any,
        ativo: true,
        created_at: '',
      },
    });
    return tokenData;
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
