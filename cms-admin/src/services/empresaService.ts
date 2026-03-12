import api from './api';
import type {
  Empresa,
  EmpresaCreate,
  EmpresaUpdate,
  PaginatedResponse,
  ListParams,
  DashboardData,
} from '../types';

const empresaService = {
  async listar(params?: ListParams): Promise<PaginatedResponse<Empresa>> {
    return api.get('/superadmin/empresas', { params }).then((r) => r.data);
  },

  async obter(id: string): Promise<Empresa> {
    return api.get(`/superadmin/empresas/${id}`).then((r) => r.data);
  },

  async criar(data: EmpresaCreate): Promise<Empresa> {
    return api.post('/superadmin/empresas', data).then((r) => r.data);
  },

  async atualizar(id: string, data: EmpresaUpdate): Promise<Empresa> {
    return api.put(`/superadmin/empresas/${id}`, data).then((r) => r.data);
  },

  async deletar(id: string): Promise<void> {
    return api.delete(`/superadmin/empresas/${id}`).then((r) => r.data);
  },

  async suspender(id: string): Promise<Empresa> {
    return api.post(`/superadmin/empresas/${id}/suspender`).then((r) => r.data);
  },

  async ativar(id: string): Promise<Empresa> {
    return api.post(`/superadmin/empresas/${id}/ativar`).then((r) => r.data);
  },

  async impersonar(empresaId: string): Promise<void> {
    return api.post(`/superadmin/impersonar/${empresaId}`).then((r) => r.data);
  },

  async dashboard(): Promise<DashboardData> {
    return api.get('/superadmin/dashboard').then((r) => r.data);
  },
};

export default empresaService;
