import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DataTable, type Column } from '@/components/table/DataTable'
import { Pagination } from '@/components/table/Pagination'
import { TableActions } from '@/components/table/TableActions'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { usePermissaoModulo } from '@/hooks/usePermissao'
import itemService from '@/services/itemService'
import type { Item, PaginationMeta } from '@/types'

export default function ItemList() {
  const navigate = useNavigate()
  const { podeCriar, podeEditar, podeDeletar } = usePermissaoModulo('itens')

  const [itens, setItens] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    pagina: 1,
    limite: 20,
    paginas: 0,
  })
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchItens = useCallback(async (pagina = 1, limite = 20) => {
    setLoading(true)
    try {
      const response = await itemService.listar({ pagina, limite })
      setItens(response.data)
      setMeta(response.meta)
    } catch {
      toast.error('Erro ao carregar itens')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItens()
  }, [fetchItens])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await itemService.deletar(deleteId)
      toast.success('Item deletado com sucesso')
      setDeleteId(null)
      fetchItens(meta.pagina, meta.limite)
    } catch {
      toast.error('Erro ao deletar item')
    }
  }

  const columns: Column<Item>[] = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      render: (item) => (
        <span className="font-medium">{item.nome}</span>
      ),
    },
    {
      key: 'categoria',
      label: 'Categoria',
      render: (item) => (
        <span className="text-[#9CA3AF]">{item.categoria?.nome || '—'}</span>
      ),
    },
    {
      key: 'ordem',
      label: 'Ordem',
      sortable: true,
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
      key: 'acoes',
      label: 'Acoes',
      render: (item) => (
        <TableActions
          onEdit={podeEditar ? () => navigate(`/itens/${item.id}`) : undefined}
          onDelete={podeDeletar ? () => setDeleteId(item.id) : undefined}
        />
      ),
    },
  ]

  return (
    <PageWrapper
      title="Itens"
      actions={
        podeCriar ? (
          <Button icon={<Plus size={16} />} onClick={() => navigate('/itens/novo')}>
            Novo Item
          </Button>
        ) : undefined
      }
    >
      <DataTable
        columns={columns}
        data={itens}
        loading={loading}
        emptyMessage="Nenhum item encontrado"
      />

      <Pagination
        meta={meta}
        onPageChange={(pagina) => fetchItens(pagina, meta.limite)}
        onLimiteChange={(limite) => fetchItens(1, limite)}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Deletar item"
        message="Esta acao nao pode ser desfeita. Deseja continuar?"
        confirmLabel="Deletar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </PageWrapper>
  )
}
