import { useMemo } from 'react'
import { useAuthStore } from '../store/authStore'

type Acao = 'ver' | 'criar' | 'editar' | 'deletar' | 'exportar'

export function usePermissao(modulo: string, acao: Acao) {
  const usuario = useAuthStore((s) => s.usuario)

  const pode = useMemo(() => {
    if (!usuario) return false

    // SuperAdmin e Admin têm acesso total
    if (usuario.role === 'superadmin' || usuario.role === 'admin') return true

    // Verificar permissões granulares
    const permissoes = usuario.permissoes
    if (!permissoes || typeof permissoes !== 'object') return false

    const moduloPerms = permissoes[modulo]
    if (!moduloPerms) return false

    // Permissões podem vir como array de strings ou como objeto
    if (Array.isArray(moduloPerms)) {
      return moduloPerms.includes(acao)
    }

    return false
  }, [usuario, modulo, acao])

  return { pode }
}

export function usePermissaoModulo(modulo: string) {
  const { pode: podeVer } = usePermissao(modulo, 'ver')
  const { pode: podeCriar } = usePermissao(modulo, 'criar')
  const { pode: podeEditar } = usePermissao(modulo, 'editar')
  const { pode: podeDeletar } = usePermissao(modulo, 'deletar')
  const { pode: podeExportar } = usePermissao(modulo, 'exportar')

  return { podeVer, podeCriar, podeEditar, podeDeletar, podeExportar }
}
