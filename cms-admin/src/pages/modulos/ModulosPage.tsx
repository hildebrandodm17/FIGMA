import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Toggle } from '../../components/ui/Toggle'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import moduloService from '../../services/moduloService'
import type { Modulo } from '../../types'

export default function ModulosPage() {
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDisable, setConfirmDisable] = useState<Modulo | null>(null)

  const fetchModulos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await moduloService.listar()
      setModulos(data)
    } catch {
      toast.error('Erro ao carregar modulos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchModulos()
  }, [fetchModulos])

  const handleToggle = async (modulo: Modulo) => {
    // If disabling, confirm first
    if (modulo.ativo) {
      setConfirmDisable(modulo)
      return
    }
    await doToggle(modulo.modulo, true)
  }

  const doToggle = async (moduloKey: string, ativo: boolean) => {
    try {
      const updated = await moduloService.toggleModulo(moduloKey, ativo)
      setModulos((prev) => prev.map((m) => (m.modulo === moduloKey ? updated : m)))
      toast.success(`Modulo ${ativo ? 'ativado' : 'desativado'} com sucesso`)
    } catch {
      toast.error('Erro ao alterar modulo')
    }
  }

  const handleConfirmDisable = async () => {
    if (!confirmDisable) return
    await doToggle(confirmDisable.modulo, false)
    setConfirmDisable(null)
  }

  if (loading) {
    return (
      <PageWrapper title="Modulos">
        <div className="max-w-2xl space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg animate-pulse" />
          ))}
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Modulos" subtitle="Ative ou desative modulos do sistema">
      <div className="max-w-2xl space-y-3">
        {modulos.map((modulo) => (
          <div
            key={modulo.modulo}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#F5F5F5] capitalize">{modulo.nome}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{modulo.descricao}</p>
            </div>
            <div className="shrink-0">
              <Toggle
                enabled={modulo.ativo}
                onChange={() => handleToggle(modulo)}
              />
            </div>
          </div>
        ))}

        {modulos.length === 0 && (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg flex items-center justify-center py-16 text-sm text-[#9CA3AF]">
            Nenhum modulo disponivel
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDisable}
        title="Desativar modulo"
        message={`Deseja desativar o modulo "${confirmDisable?.nome}"? Os dados nao serao perdidos, mas o modulo ficara inacessivel.`}
        confirmLabel="Desativar"
        onConfirm={handleConfirmDisable}
        onCancel={() => setConfirmDisable(null)}
      />
    </PageWrapper>
  )
}
