import api from './api';
import type { Galeria, GaleriaCreate, GaleriaUpdate, PaginatedResponse, ListParams } from '../types';

const galeriaService = {
  async listar(params?: ListParams): Promise<PaginatedResponse<Galeria>> {
    return api.get('/admin/galeria', { params }).then((r) => r.data);
  },

  async obter(id: string): Promise<Galeria> {
    return api.get(`/admin/galeria/${id}`).then((r) => r.data);
  },

  async criar(data: GaleriaCreate): Promise<Galeria> {
    return api.post('/admin/galeria', data).then((r) => r.data);
  },

  async atualizar(id: string, data: GaleriaUpdate): Promise<Galeria> {
    return api.put(`/admin/galeria/${id}`, data).then((r) => r.data);
  },

  async deletar(id: string): Promise<void> {
    return api.delete(`/admin/galeria/${id}`).then((r) => r.data);
  },

  async reordenar(ordem: Array<{ id: string; ordem: number }>): Promise<void> {
    return api.patch('/admin/galeria/reordenar', { ordem }).then((r) => r.data);
  },
};

export default galeriaService;
