import api from './api';
import type { Tema, TemaUpdate } from '../types';

const temaService = {
  async obter(): Promise<Tema> {
    return api.get('/admin/temas').then((r) => r.data);
  },

  async atualizar(data: TemaUpdate): Promise<Tema> {
    return api.put('/admin/temas', data).then((r) => r.data);
  },
};

export default temaService;
