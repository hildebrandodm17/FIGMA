import api from './api';
import type { Depoimento, DepoimentoCreate, DepoimentoUpdate, PaginatedResponse, ListParams } from '../types';

const depoimentoService = {
  async listar(params?: ListParams): Promise<PaginatedResponse<Depoimento>> {
    return api.get('/admin/depoimentos', { params }).then((r) => r.data);
  },

  async obter(id: string): Promise<Depoimento> {
    return api.get(`/admin/depoimentos/${id}`).then((r) => r.data);
  },

  async criar(data: DepoimentoCreate): Promise<Depoimento> {
    return api.post('/admin/depoimentos', data).then((r) => r.data);
  },

  async atualizar(id: string, data: DepoimentoUpdate): Promise<Depoimento> {
    return api.put(`/admin/depoimentos/${id}`, data).then((r) => r.data);
  },

  async deletar(id: string): Promise<void> {
    return api.delete(`/admin/depoimentos/${id}`).then((r) => r.data);
  },

  async reordenar(ordem: Array<{ id: string; ordem: number }>): Promise<void> {
    return api.patch('/admin/depoimentos/reordenar', { ordem }).then((r) => r.data);
  },
};

export default depoimentoService;
