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
import bannerService from '@/services/bannerService'
import type { Banner, PaginationMeta } from '@/types'

export default function BannerList() {
  const navigate = useNavigate()
  const { podeCriar, podeEditar, podeDeletar } = usePermissaoModulo('banners')

  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    pagina: 1,
    limite: 20,
    paginas: 0,
  })
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchBanners = useCallback(async (pagina = 1, limite = 20) => {
    setLoading(true)
    try {
      const response = await bannerService.listar({ pagina, limite })
      setBanners(response.data)
      setMeta(response.meta)
    } catch {
      toast.error('Erro ao carregar banners')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await bannerService.deletar(deleteId)
      toast.success('Banner deletado com sucesso')
      setDeleteId(null)
      fetchBanners(meta.pagina, meta.limite)
    } catch {
      toast.error('Erro ao deletar banner')
    }
  }

  const columns: Column<Banner>[] = [
    {
      key: 'titulo',
      label: 'Titulo',
      sortable: true,
      render: (banner) => (
        <span className="font-medium">{banner.titulo || '(Sem titulo)'}</span>
      ),
    },
    {
      key: 'ativo',
      label: 'Status',
      render: (banner) => (
        <Badge variant={banner.ativo ? 'active' : 'inactive'}>
          {banner.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'ordem',
      label: 'Ordem',
      sortable: true,
    },
    {
      key: 'acoes',
      label: 'Acoes',
      render: (banner) => (
        <TableActions
          onEdit={podeEditar ? () => navigate(`/banners/${banner.id}`) : undefined}
          onDelete={podeDeletar ? () => setDeleteId(banner.id) : undefined}
        />
      ),
    },
  ]

  return (
    <PageWrapper
      title="Banners"
      actions={
        podeCriar ? (
          <Button icon={<Plus size={16} />} onClick={() => navigate('/banners/novo')}>
            Novo Banner
          </Button>
        ) : undefined
      }
    >
      <DataTable
        columns={columns}
        data={banners}
        loading={loading}
        emptyMessage="Nenhum banner cadastrado"
      />

      <Pagination
        meta={meta}
        onPageChange={(pagina) => fetchBanners(pagina, meta.limite)}
        onLimiteChange={(limite) => fetchBanners(1, limite)}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Deletar banner"
        message="Esta acao nao pode ser desfeita. Deseja continuar?"
        confirmLabel="Deletar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </PageWrapper>
  )
}
