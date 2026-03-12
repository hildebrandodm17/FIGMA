import api from './api';
import type { Contato, ContatoUpdate } from '../types';

const contatoService = {
  async obter(): Promise<Contato> {
    return api.get('/admin/contatos').then((r) => r.data);
  },

  async atualizar(data: ContatoUpdate): Promise<Contato> {
    return api.put('/admin/contatos', data).then((r) => r.data);
  },
};

export default contatoService;
