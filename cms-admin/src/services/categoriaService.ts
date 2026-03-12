import api from './api';
import type { Categoria, CategoriaCreate, CategoriaUpdate, PaginatedResponse, ListParams } from '../types';

const categoriaService = {
  async listar(params?: ListParams): Promise<PaginatedResponse<Categoria>> {
    return api.get('/admin/categorias', { params }).then((r) => r.data);
  },

  async obter(id: string): Promise<Categoria> {
    return api.get(`/admin/categorias/${id}`).then((r) => r.data);
  },

  async criar(data: CategoriaCreate): Promise<Categoria> {
    return api.post('/admin/categorias', data).then((r) => r.data);
  },

  async atualizar(id: string, data: CategoriaUpdate): Promise<Categoria> {
    return api.put(`/admin/categorias/${id}`, data).then((r) => r.data);
  },

  async deletar(id: string): Promise<void> {
    return api.delete(`/admin/categorias/${id}`).then((r) => r.data);
  },
};

export default categoriaService;
