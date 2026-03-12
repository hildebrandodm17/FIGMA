import api from './api';
import type { Item, ItemCreate, ItemUpdate, PaginatedResponse, ListParams } from '../types';

const itemService = {
  async listar(params?: ListParams): Promise<PaginatedResponse<Item>> {
    return api.get('/admin/itens', { params }).then((r) => r.data);
  },

  async obter(id: string): Promise<Item> {
    return api.get(`/admin/itens/${id}`).then((r) => r.data);
  },

  async criar(data: ItemCreate): Promise<Item> {
    return api.post('/admin/itens', data).then((r) => r.data);
  },

  async atualizar(id: string, data: ItemUpdate): Promise<Item> {
    return api.put(`/admin/itens/${id}`, data).then((r) => r.data);
  },

  async deletar(id: string): Promise<void> {
    return api.delete(`/admin/itens/${id}`).then((r) => r.data);
  },

  async reordenar(ordem: Array<{ id: string; ordem: number }>): Promise<void> {
    return api.patch('/admin/itens/reordenar', { ordem }).then((r) => r.data);
  },
};

export default itemService;
