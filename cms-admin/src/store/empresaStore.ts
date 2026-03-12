import { create } from 'zustand';
import type { Empresa } from '../types';

interface EmpresaState {
  empresaAtiva: Empresa | null;
  impersonado: boolean;

  setEmpresa: (empresa: Empresa) => void;
  setImpersonado: (val: boolean) => void;
  limpar: () => void;
}

export const useEmpresaStore = create<EmpresaState>()((set) => ({
  empresaAtiva: null,
  impersonado: false,

  setEmpresa: (empresa) =>
    set({
      empresaAtiva: empresa,
    }),

  setImpersonado: (val) =>
    set({
      impersonado: val,
    }),

  limpar: () =>
    set({
      empresaAtiva: null,
      impersonado: false,
    }),
}));
