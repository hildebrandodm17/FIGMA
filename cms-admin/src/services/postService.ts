import api from './api';
import type { Post, PostCreate, PostUpdate, PaginatedResponse, ListParams } from '../types';

const postService = {
  async listar(params?: ListParams): Promise<PaginatedResponse<Post>> {
    return api.get('/admin/posts', { params }).then((r) => r.data);
  },

  async obter(id: string): Promise<Post> {
    return api.get(`/admin/posts/${id}`).then((r) => r.data);
  },

  async criar(data: PostCreate): Promise<Post> {
    return api.post('/admin/posts', data).then((r) => r.data);
  },

  async atualizar(id: string, data: PostUpdate): Promise<Post> {
    return api.put(`/admin/posts/${id}`, data).then((r) => r.data);
  },

  async deletar(id: string): Promise<void> {
    return api.delete(`/admin/posts/${id}`).then((r) => r.data);
  },
};

export default postService;
