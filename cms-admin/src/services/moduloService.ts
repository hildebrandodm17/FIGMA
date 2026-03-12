import api from './api';
import type { Modulo } from '../types';

const moduloService = {
  async listar(): Promise<Modulo[]> {
    return api.get('/admin/modulos').then((r) => r.data);
  },

  async toggleModulo(modulo: string, ativo: boolean): Promise<Modulo> {
    return api.patch(`/admin/modulos/${modulo}`, { ativo }).then((r) => r.data);
  },
};

export default moduloService;
