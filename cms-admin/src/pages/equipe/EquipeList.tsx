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
import equipeService from '../../services/equipeService'
import type { Equipe, PaginationMeta } from '../../types'

export default function EquipeList() {
  const navigate = useNavigate()
  const { podeCriar, podeEditar, podeDeletar } = usePermissaoModulo('equipe')

  const [membros, setMembros] = useState<Equipe[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, pagina: 1, limite: 20, paginas: 1 })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchMembros = useCallback(async (pagina = 1, limite = 20) => {
    setLoading(true)
    try {
      const res = await equipeService.listar({ pagina, limite })
      setMembros(res.data)
      setMeta(res.meta)
    } catch {
      toast.error('Erro ao carregar equipe')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMembros()
  }, [fetchMembros])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await equipeService.deletar(deleteId)
      toast.success('Membro deletado com sucesso')
      setDeleteId(null)
      fetchMembros(meta.pagina, meta.limite)
    } catch {
      toast.error('Erro ao deletar membro')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Equipe>[] = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'cargo', label: 'Cargo', sortable: true },
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
          onEdit={podeEditar ? () => navigate(`/equipe/${item.id}`) : undefined}
          onDelete={podeDeletar ? () => setDeleteId(item.id) : undefined}
        />
      ),
    },
  ]

  return (
    <PageWrapper
      title="Equipe"
      subtitle="Gerencie os membros da equipe"
      actions={
        podeCriar ? (
          <Button icon={<Plus size={16} />} onClick={() => navigate('/equipe/novo')}>
            Novo membro
          </Button>
        ) : undefined
      }
    >
      <DataTable columns={columns} data={membros} loading={loading} emptyMessage="Nenhum membro cadastrado" />
      <Pagination meta={meta} onPageChange={(p) => fetchMembros(p, meta.limite)} onLimiteChange={(l) => fetchMembros(1, l)} />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Deletar membro"
        message="Esta acao nao pode ser desfeita. Deseja continuar?"
        confirmLabel={deleting ? 'Deletando...' : 'Deletar'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </PageWrapper>
  )
}
