import api from './api';
import type { Faq, FaqCreate, FaqUpdate, PaginatedResponse, ListParams } from '../types';

const faqService = {
  async listar(params?: ListParams): Promise<PaginatedResponse<Faq>> {
    return api.get('/admin/faq', { params }).then((r) => r.data);
  },

  async obter(id: string): Promise<Faq> {
    return api.get(`/admin/faq/${id}`).then((r) => r.data);
  },

  async criar(data: FaqCreate): Promise<Faq> {
    return api.post('/admin/faq', data).then((r) => r.data);
  },

  async atualizar(id: string, data: FaqUpdate): Promise<Faq> {
    return api.put(`/admin/faq/${id}`, data).then((r) => r.data);
  },

  async deletar(id: string): Promise<void> {
    return api.delete(`/admin/faq/${id}`).then((r) => r.data);
  },

  async reordenar(ordem: Array<{ id: string; ordem: number }>): Promise<void> {
    return api.patch('/admin/faq/reordenar', { ordem }).then((r) => r.data);
  },
};

export default faqService;
