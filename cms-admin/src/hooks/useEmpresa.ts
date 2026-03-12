import { useEmpresaStore } from '../store/empresaStore'

export function useEmpresa() {
  const { empresaAtiva, impersonado, setEmpresa, setImpersonado, limpar } = useEmpresaStore()

  return {
    empresaAtiva,
    impersonado,
    setEmpresa,
    setImpersonado,
    limpar,
  }
}
