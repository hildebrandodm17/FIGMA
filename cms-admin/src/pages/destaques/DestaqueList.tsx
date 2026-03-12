import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { DataTable, type Column } from '../../components/table/DataTable'
import { Pagination } from '../../components/table/Pagination'
import { TableActions } from '../../components/table/TableActions'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { usePermissaoModulo } from '../../hooks/usePermissao'
import destaqueService from '../../services/destaqueService'
import type { Destaque, PaginationMeta } from '../../types'

export default function DestaqueList() {
  const navigate = useNavigate()
  const { podeCriar, podeEditar, podeDeletar } = usePermissaoModulo('destaques')

  const [destaques, setDestaques] = useState<Destaque[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, pagina: 1, limite: 20, paginas: 1 })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchDestaques = useCallback(async (pagina = 1, limite = 20) => {
    setLoading(true)
    try {
      const res = await destaqueService.listar({ pagina, limite })
      setDestaques(res.data)
      setMeta(res.meta)
    } catch {
      toast.error('Erro ao carregar destaques')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDestaques()
  }, [fetchDestaques])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await destaqueService.deletar(deleteId)
      toast.success('Destaque deletado com sucesso')
      setDeleteId(null)
      fetchDestaques(meta.pagina, meta.limite)
    } catch {
      toast.error('Erro ao deletar destaque')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Destaque>[] = [
    { key: 'titulo', label: 'Titulo', sortable: true },
    { key: 'ordem', label: 'Ordem', sortable: true },
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
      key: 'acoes',
      label: 'Acoes',
      render: (item) => (
        <TableActions
          onEdit={podeEditar ? () => navigate(`/destaques/${item.id}`) : undefined}
          onDelete={podeDeletar ? () => setDeleteId(item.id) : undefined}
        />
      ),
    },
  ]

  return (
    <PageWrapper
      title="Destaques"
      subtitle="Gerencie os destaques do site"
      actions={
        podeCriar ? (
          <Button icon={<Plus size={16} />} onClick={() => navigate('/destaques/novo')}>
            Novo destaque
          </Button>
        ) : undefined
      }
    >
      <DataTable columns={columns} data={destaques} loading={loading} emptyMessage="Nenhum destaque cadastrado" />
      <Pagination meta={meta} onPageChange={(p) => fetchDestaques(p, meta.limite)} onLimiteChange={(l) => fetchDestaques(1, l)} />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Deletar destaque"
        message="Esta acao nao pode ser desfeita. Deseja continuar?"
        confirmLabel={deleting ? 'Deletando...' : 'Deletar'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </PageWrapper>
  )
}
