import api from './api';
import type { Destaque, DestaqueCreate, DestaqueUpdate, PaginatedResponse, ListParams } from '../types';

const destaqueService = {
  async listar(params?: ListParams): Promise<PaginatedResponse<Destaque>> {
    return api.get('/admin/destaques', { params }).then((r) => r.data);
  },

  async obter(id: string): Promise<Destaque> {
    return api.get(`/admin/destaques/${id}`).then((r) => r.data);
  },

  async criar(data: DestaqueCreate): Promise<Destaque> {
    return api.post('/admin/destaques', data).then((r) => r.data);
  },

  async atualizar(id: string, data: DestaqueUpdate): Promise<Destaque> {
    return api.put(`/admin/destaques/${id}`, data).then((r) => r.data);
  },

  async deletar(id: string): Promise<void> {
    return api.delete(`/admin/destaques/${id}`).then((r) => r.data);
  },

  async reordenar(ordem: Array<{ id: string; ordem: number }>): Promise<void> {
    return api.patch('/admin/destaques/reordenar', { ordem }).then((r) => r.data);
  },
};

export default destaqueService;
