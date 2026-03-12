import api from './api';
import type { Equipe, EquipeCreate, EquipeUpdate, PaginatedResponse, ListParams } from '../types';

const equipeService = {
  async listar(params?: ListParams): Promise<PaginatedResponse<Equipe>> {
    return api.get('/admin/equipe', { params }).then((r) => r.data);
  },

  async obter(id: string): Promise<Equipe> {
    return api.get(`/admin/equipe/${id}`).then((r) => r.data);
  },

  async criar(data: EquipeCreate): Promise<Equipe> {
    return api.post('/admin/equipe', data).then((r) => r.data);
  },

  async atualizar(id: string, data: EquipeUpdate): Promise<Equipe> {
    return api.put(`/admin/equipe/${id}`, data).then((r) => r.data);
  },

  async deletar(id: string): Promise<void> {
    return api.delete(`/admin/equipe/${id}`).then((r) => r.data);
  },

  async reordenar(ordem: Array<{ id: string; ordem: number }>): Promise<void> {
    return api.patch('/admin/equipe/reordenar', { ordem }).then((r) => r.data);
  },
};

export default equipeService;
