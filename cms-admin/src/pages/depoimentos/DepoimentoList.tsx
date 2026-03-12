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
import depoimentoService from '../../services/depoimentoService'
import type { Depoimento, PaginationMeta } from '../../types'

export default function DepoimentoList() {
  const navigate = useNavigate()
  const { podeCriar, podeEditar, podeDeletar } = usePermissaoModulo('depoimentos')

  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, pagina: 1, limite: 20, paginas: 1 })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchDepoimentos = useCallback(async (pagina = 1, limite = 20) => {
    setLoading(true)
    try {
      const res = await depoimentoService.listar({ pagina, limite })
      setDepoimentos(res.data)
      setMeta(res.meta)
    } catch {
      toast.error('Erro ao carregar depoimentos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDepoimentos()
  }, [fetchDepoimentos])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await depoimentoService.deletar(deleteId)
      toast.success('Depoimento deletado com sucesso')
      setDeleteId(null)
      fetchDepoimentos(meta.pagina, meta.limite)
    } catch {
      toast.error('Erro ao deletar depoimento')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Depoimento>[] = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'empresa', label: 'Empresa', sortable: true },
    {
      key: 'nota',
      label: 'Nota',
      sortable: true,
      render: (item) => (
        <span className="text-[#F5F5F5]">
          {item.nota != null ? `${item.nota}/5` : '--'}
        </span>
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
      key: 'acoes',
      label: 'Acoes',
      render: (item) => (
        <TableActions
          onEdit={podeEditar ? () => navigate(`/depoimentos/${item.id}`) : undefined}
          onDelete={podeDeletar ? () => setDeleteId(item.id) : undefined}
        />
      ),
    },
  ]

  return (
    <PageWrapper
      title="Depoimentos"
      subtitle="Gerencie os depoimentos de clientes"
      actions={
        podeCriar ? (
          <Button icon={<Plus size={16} />} onClick={() => navigate('/depoimentos/novo')}>
            Novo depoimento
          </Button>
        ) : undefined
      }
    >
      <DataTable columns={columns} data={depoimentos} loading={loading} emptyMessage="Nenhum depoimento cadastrado" />
      <Pagination meta={meta} onPageChange={(p) => fetchDepoimentos(p, meta.limite)} onLimiteChange={(l) => fetchDepoimentos(1, l)} />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Deletar depoimento"
        message="Esta acao nao pode ser desfeita. Deseja continuar?"
        confirmLabel={deleting ? 'Deletando...' : 'Deletar'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </PageWrapper>
  )
}
