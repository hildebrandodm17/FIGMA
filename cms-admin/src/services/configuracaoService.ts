import api from './api';
import type { ConfiguracaoSecao, ConfiguracaoChave } from '../types';

const configuracaoService = {
  async listarSecoes(): Promise<ConfiguracaoSecao[]> {
    return api.get('/admin/configuracoes').then((r) => r.data);
  },

  async obterSecao(secao: string): Promise<ConfiguracaoSecao> {
    return api.get(`/admin/configuracoes/${secao}`).then((r) => r.data);
  },

  async atualizarSecao(
    secao: string,
    valores: Record<string, string>
  ): Promise<ConfiguracaoSecao> {
    return api.put(`/admin/configuracoes/${secao}`, valores).then((r) => r.data);
  },

  async adicionarChave(secao: string, data: ConfiguracaoChave): Promise<void> {
    return api.post(`/admin/configuracoes/${secao}/nova-chave`, data).then((r) => r.data);
  },
};

export default configuracaoService;
