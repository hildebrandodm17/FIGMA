import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { DataTable, type Column } from '../../components/table/DataTable'
import { Pagination } from '../../components/table/Pagination'
import { TableActions } from '../../components/table/TableActions'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import empresaService from '../../services/empresaService'
import { formatDate } from '../../utils/formatDate'
import type { Empresa, PaginationMeta } from '../../types'

export default function EmpresaList() {
  const navigate = useNavigate()

  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, pagina: 1, limite: 20, paginas: 1 })
  const [busca, setBusca] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchEmpresas = useCallback(async (pagina = 1, limite = 20, search?: string) => {
    setLoading(true)
    try {
      const params: Record<string, any> = { pagina, limite }
      if (search) params.busca = search
      const res = await empresaService.listar(params)
      setEmpresas(res.data)
      setMeta(res.meta)
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
    fetchEmpresas(1, meta.limite, busca)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await empresaService.deletar(deleteId)
      toast.success('Empresa deletada com sucesso')
      setDeleteId(null)
      fetchEmpresas(meta.pagina, meta.limite, busca)
    } catch {
      toast.error('Erro ao deletar empresa')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Empresa>[] = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'slug', label: 'Slug', sortable: true },
    {
      key: 'plano',
      label: 'Plano',
      sortable: true,
      render: (item) => (
        <span className="text-sm text-[#F5F5F5] capitalize">{item.plano}</span>
      ),
    },
    {
      key: 'ativo',
      label: 'Status',
      render: (item) => (
        <Badge variant={item.ativo ? 'active' : 'inactive'}>
          {item.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Data',
      sortable: true,
      render: (item) => <span>{formatDate(item.created_at)}</span>,
    },
    {
      key: 'acoes',
      label: 'Acoes',
      render: (item) => (
        <TableActions
          onEdit={() => navigate(`/superadmin/empresas/${item.id}`)}
          onDelete={() => setDeleteId(item.id)}
        />
      ),
    },
  ]

  return (
    <PageWrapper
      title="Empresas"
      subtitle="Gerenciamento de empresas"
      actions={
        <Button icon={<Plus size={16} />} onClick={() => navigate('/superadmin/empresas/novo')}>
          Nova empresa
        </Button>
      }
    >
      {/* Search */}
      <div className="flex items-center gap-2 max-w-md">
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

      <DataTable columns={columns} data={empresas} loading={loading} emptyMessage="Nenhuma empresa encontrada" />
      <Pagination meta={meta} onPageChange={(p) => fetchEmpresas(p, meta.limite, busca)} onLimiteChange={(l) => fetchEmpresas(1, l, busca)} />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Deletar empresa"
        message="Esta acao nao pode ser desfeita. Todos os dados da empresa serao removidos. Deseja continuar?"
        confirmLabel={deleting ? 'Deletando...' : 'Deletar'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </PageWrapper>
  )
}
