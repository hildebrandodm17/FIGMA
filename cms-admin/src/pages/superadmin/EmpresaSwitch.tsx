import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Building2, ArrowRightLeft, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import empresaService from '../../services/empresaService'
import { useEmpresaStore } from '../../store/empresaStore'
import type { Empresa } from '../../types'

export default function EmpresaSwitch() {
  const navigate = useNavigate()
  const { empresaAtiva, setEmpresa, setImpersonado, limpar } = useEmpresaStore()

  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const fetchEmpresas = useCallback(async (search?: string) => {
    setLoading(true)
    try {
      const params: Record<string, any> = { pagina: 1, limite: 100 }
      if (search) params.busca = search
      const res = await empresaService.listar(params)
      setEmpresas(res.data)
    } catch {
      toast.error('Erro ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmpresas()
  }, [fetchEmpresas])

  const handleSearch = () => {
    fetchEmpresas(busca)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleSwitch = async (empresa: Empresa) => {
    setSwitching(empresa.id)
    try {
      await empresaService.impersonar(empresa.id)
      setEmpresa(empresa)
      setImpersonado(true)
      toast.success(`Acessando como: ${empresa.nome}`)
      navigate('/dashboard')
    } catch {
      toast.error('Erro ao trocar de empresa')
    } finally {
      setSwitching(null)
    }
  }

  const handleStopImpersonating = () => {
    limpar()
    toast.success('Voltou ao modo SuperAdmin')
    navigate('/superadmin/empresas')
  }

  return (
    <PageWrapper
      title="Trocar Empresa"
      subtitle="Selecione uma empresa para acessar como administrador"
      actions={
        empresaAtiva && (
          <Button
            variant="secondary"
            icon={<X size={16} />}
            onClick={handleStopImpersonating}
          >
            Parar de impersonar
          </Button>
        )
      }
    >
      {empresaAtiva && (
        <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 flex items-center gap-3">
          <Building2 size={20} className="text-green-500" />
          <div>
            <p className="text-sm text-[#A3A3A3]">Empresa ativa</p>
            <p className="font-medium text-[#F5F5F5]">{empresaAtiva.nome}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 max-w-md mb-6">
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar empresa..."
        />
        <Button variant="secondary" icon={<Search size={16} />} onClick={handleSearch}>
          Buscar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : empresas.length === 0 ? (
        <div className="text-center py-12 text-[#A3A3A3]">
          Nenhuma empresa encontrada
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {empresas.map((empresa) => (
            <button
              key={empresa.id}
              onClick={() => handleSwitch(empresa)}
              disabled={switching !== null || !empresa.ativo}
              className={`
                text-left rounded-lg border p-4 transition-colors
                ${
                  empresaAtiva?.id === empresa.id
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3A3A3A]'
                }
                ${!empresa.ativo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-[#F5F5F5] truncate">{empresa.nome}</h3>
                  <p className="text-sm text-[#A3A3A3] mt-1">{empresa.slug}</p>
                  <p className="text-xs text-[#666] mt-1 capitalize">{empresa.plano}</p>
                </div>
                <div className="flex flex-col items-end gap-2 ml-3">
                  <Badge variant={empresa.ativo ? 'active' : 'inactive'}>
                    {empresa.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {switching === empresa.id ? (
                    <Spinner size="sm" />
                  ) : (
                    <ArrowRightLeft size={16} className="text-[#666]" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
