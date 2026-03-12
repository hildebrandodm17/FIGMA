import api from './api';
import type { Usuario, UsuarioCreate, UsuarioUpdate, PaginatedResponse, ListParams } from '../types';

const usuarioService = {
  async listar(params?: ListParams): Promise<PaginatedResponse<Usuario>> {
    return api.get('/admin/usuarios', { params }).then((r) => r.data);
  },

  async obter(id: string): Promise<Usuario> {
    return api.get(`/admin/usuarios/${id}`).then((r) => r.data);
  },

  async criar(data: UsuarioCreate): Promise<Usuario> {
    return api.post('/admin/usuarios', data).then((r) => r.data);
  },

  async atualizar(id: string, data: UsuarioUpdate): Promise<Usuario> {
    return api.put(`/admin/usuarios/${id}`, data).then((r) => r.data);
  },

  async deletar(id: string): Promise<void> {
    return api.delete(`/admin/usuarios/${id}`).then((r) => r.data);
  },
};

export default usuarioService;
