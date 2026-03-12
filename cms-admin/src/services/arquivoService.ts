import api from './api';
import type { Arquivo, PaginatedResponse, ListParams } from '../types';

const arquivoService = {
  async upload(file: File): Promise<Arquivo> {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post('/admin/arquivos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  async listar(params?: ListParams): Promise<PaginatedResponse<Arquivo>> {
    return api.get('/admin/arquivos', { params }).then((r) => r.data);
  },

  async deletar(id: string): Promise<void> {
    return api.delete(`/admin/arquivos/${id}`).then((r) => r.data);
  },
};

export default arquivoService;
