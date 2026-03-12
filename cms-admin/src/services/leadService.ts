import api from './api';
import type { Lead, PaginatedResponse, ListParams, LeadGrafico } from '../types';

const leadService = {
  async listar(params?: ListParams): Promise<PaginatedResponse<Lead>> {
    return api.get('/admin/leads', { params }).then((r) => r.data);
  },

  async obter(id: string): Promise<Lead> {
    return api.get(`/admin/leads/${id}`).then((r) => r.data);
  },

  async marcarRespondido(id: string): Promise<Lead> {
    return api.put(`/admin/leads/${id}`, { respondido: true }).then((r) => r.data);
  },

  async deletar(id: string): Promise<void> {
    return api.delete(`/admin/leads/${id}`).then((r) => r.data);
  },

  async exportarCSV(): Promise<Blob> {
    return api
      .get('/admin/leads/export', { responseType: 'blob' })
      .then((r) => r.data);
  },

  async grafico(): Promise<LeadGrafico[]> {
    return api.get('/admin/leads/grafico').then((r) => r.data);
  },
};

export default leadService;
