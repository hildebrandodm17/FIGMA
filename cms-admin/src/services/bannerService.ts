import api from './api';
import type { Banner, BannerCreate, BannerUpdate, PaginatedResponse, ListParams } from '../types';

const bannerService = {
  async listar(params?: ListParams): Promise<PaginatedResponse<Banner>> {
    return api.get('/admin/banners', { params }).then((r) => r.data);
  },

  async obter(id: string): Promise<Banner> {
    return api.get(`/admin/banners/${id}`).then((r) => r.data);
  },

  async criar(data: BannerCreate): Promise<Banner> {
    return api.post('/admin/banners', data).then((r) => r.data);
  },

  async atualizar(id: string, data: BannerUpdate): Promise<Banner> {
    return api.put(`/admin/banners/${id}`, data).then((r) => r.data);
  },

  async deletar(id: string): Promise<void> {
    return api.delete(`/admin/banners/${id}`).then((r) => r.data);
  },

  async reordenar(ordem: Array<{ id: string; ordem: number }>): Promise<void> {
    return api.patch('/admin/banners/reordenar', { ordem }).then((r) => r.data);
  },
};

export default bannerService;
