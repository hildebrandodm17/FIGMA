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
import faqService from '../../services/faqService'
import type { Faq, PaginationMeta } from '../../types'

export default function FaqList() {
  const navigate = useNavigate()
  const { podeCriar, podeEditar, podeDeletar } = usePermissaoModulo('faq')

  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, pagina: 1, limite: 20, paginas: 1 })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchFaqs = useCallback(async (pagina = 1, limite = 20) => {
    setLoading(true)
    try {
      const res = await faqService.listar({ pagina, limite })
      setFaqs(res.data)
      setMeta(res.meta)
    } catch {
      toast.error('Erro ao carregar FAQs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFaqs()
  }, [fetchFaqs])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await faqService.deletar(deleteId)
      toast.success('FAQ deletada com sucesso')
      setDeleteId(null)
      fetchFaqs(meta.pagina, meta.limite)
    } catch {
      toast.error('Erro ao deletar FAQ')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Faq>[] = [
    {
      key: 'pergunta',
      label: 'Pergunta',
      sortable: true,
      render: (item) => (
        <span className="line-clamp-1 max-w-xs">{item.pergunta}</span>
      ),
    },
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
          onEdit={podeEditar ? () => navigate(`/faq/${item.id}`) : undefined}
          onDelete={podeDeletar ? () => setDeleteId(item.id) : undefined}
        />
      ),
    },
  ]

  return (
    <PageWrapper
      title="FAQ"
      subtitle="Perguntas frequentes"
      actions={
        podeCriar ? (
          <Button icon={<Plus size={16} />} onClick={() => navigate('/faq/novo')}>
            Nova pergunta
          </Button>
        ) : undefined
      }
    >
      <DataTable columns={columns} data={faqs} loading={loading} emptyMessage="Nenhuma pergunta cadastrada" />
      <Pagination meta={meta} onPageChange={(p) => fetchFaqs(p, meta.limite)} onLimiteChange={(l) => fetchFaqs(1, l)} />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Deletar FAQ"
        message="Esta acao nao pode ser desfeita. Deseja continuar?"
        confirmLabel={deleting ? 'Deletando...' : 'Deletar'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </PageWrapper>
  )
}
