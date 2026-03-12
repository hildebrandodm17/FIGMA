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
import { Select } from '@/components/ui/Select'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { usePermissaoModulo } from '@/hooks/usePermissao'
import categoriaService from '@/services/categoriaService'
import type { Categoria, PaginationMeta } from '@/types'

const TIPOS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'post', label: 'Post' },
  { value: 'item', label: 'Item' },
]

export default function CategoriaList() {
  const navigate = useNavigate()
  const { podeCriar, podeEditar, podeDeletar } = usePermissaoModulo('categorias')

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [tipo, setTipo] = useState('')
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    pagina: 1,
    limite: 20,
    paginas: 0,
  })
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchCategorias = useCallback(async (pagina = 1, limite = 20) => {
    setLoading(true)
    try {
      const params: Record<string, any> = { pagina, limite }
      if (tipo) params.tipo = tipo
      const response = await categoriaService.listar(params)
      setCategorias(response.data)
      setMeta(response.meta)
    } catch {
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }, [tipo])

  useEffect(() => {
    fetchCategorias()
  }, [fetchCategorias])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await categoriaService.deletar(deleteId)
      toast.success('Categoria deletada com sucesso')
      setDeleteId(null)
      fetchCategorias(meta.pagina, meta.limite)
    } catch {
      toast.error('Erro ao deletar categoria')
    }
  }

  const columns: Column<Categoria>[] = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      render: (cat) => (
        <span className="font-medium">{cat.nome}</span>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      sortable: true,
      render: (cat) => (
        <span className="capitalize text-[#9CA3AF]">{cat.tipo}</span>
      ),
    },
    {
      key: 'ativo',
      label: 'Status',
      render: (cat) => (
        <Badge variant={cat.ativo ? 'active' : 'inactive'}>
          {cat.ativo ? 'Ativa' : 'Inativa'}
        </Badge>
      ),
    },
    {
      key: 'acoes',
      label: 'Acoes',
      render: (cat) => (
        <TableActions
          onEdit={podeEditar ? () => navigate(`/categorias/${cat.id}`) : undefined}
          onDelete={podeDeletar ? () => setDeleteId(cat.id) : undefined}
        />
      ),
    },
  ]

  return (
    <PageWrapper
      title="Categorias"
      actions={
        podeCriar ? (
          <Button icon={<Plus size={16} />} onClick={() => navigate('/categorias/novo')}>
            Nova Categoria
          </Button>
        ) : undefined
      }
    >
      <div className="flex items-center gap-3 mb-1">
        <Select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-48"
        >
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={categorias}
        loading={loading}
        emptyMessage="Nenhuma categoria encontrada"
      />

      <Pagination
        meta={meta}
        onPageChange={(pagina) => fetchCategorias(pagina, meta.limite)}
        onLimiteChange={(limite) => fetchCategorias(1, limite)}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Deletar categoria"
        message="Esta acao nao pode ser desfeita. Deseja continuar?"
        confirmLabel="Deletar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </PageWrapper>
  )
}
