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
import postService from '@/services/postService'
import { formatDate } from '@/utils/formatDate'
import type { Post, PaginationMeta } from '@/types'

const TIPOS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'post', label: 'Post' },
  { value: 'noticia', label: 'Noticia' },
  { value: 'artigo', label: 'Artigo' },
  { value: 'case', label: 'Case' },
]

export default function PostList() {
  const navigate = useNavigate()
  const { podeCriar, podeEditar, podeDeletar } = usePermissaoModulo('posts')

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [tipo, setTipo] = useState('')
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    pagina: 1,
    limite: 20,
    paginas: 0,
  })
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchPosts = useCallback(async (pagina = 1, limite = 20) => {
    setLoading(true)
    try {
      const params: Record<string, any> = { pagina, limite }
      if (tipo) params.tipo = tipo
      const response = await postService.listar(params)
      setPosts(response.data)
      setMeta(response.meta)
    } catch {
      toast.error('Erro ao carregar posts')
    } finally {
      setLoading(false)
    }
  }, [tipo])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await postService.deletar(deleteId)
      toast.success('Post deletado com sucesso')
      setDeleteId(null)
      fetchPosts(meta.pagina, meta.limite)
    } catch {
      toast.error('Erro ao deletar post')
    }
  }

  const columns: Column<Post>[] = [
    {
      key: 'titulo',
      label: 'Titulo',
      sortable: true,
      render: (post) => (
        <span className="font-medium">{post.titulo}</span>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      sortable: true,
      render: (post) => (
        <span className="capitalize text-[#9CA3AF]">{post.tipo}</span>
      ),
    },
    {
      key: 'publicado',
      label: 'Status',
      render: (post) => (
        <Badge variant={post.publicado ? 'published' : 'draft'}>
          {post.publicado ? 'Publicado' : 'Rascunho'}
        </Badge>
      ),
    },
    {
      key: 'categoria',
      label: 'Categoria',
      render: (post) => (
        <span className="text-[#9CA3AF]">{post.categoria?.nome || '—'}</span>
      ),
    },
    {
      key: 'publicado_em',
      label: 'Data',
      sortable: true,
      render: (post) => (
        <span className="text-[#9CA3AF]">{formatDate(post.publicado_em || post.created_at)}</span>
      ),
    },
    {
      key: 'acoes',
      label: 'Acoes',
      render: (post) => (
        <TableActions
          onEdit={podeEditar ? () => navigate(`/posts/${post.id}`) : undefined}
          onDelete={podeDeletar ? () => setDeleteId(post.id) : undefined}
        />
      ),
    },
  ]

  return (
    <PageWrapper
      title="Posts"
      actions={
        podeCriar ? (
          <Button icon={<Plus size={16} />} onClick={() => navigate('/posts/novo')}>
            Novo Post
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
        data={posts}
        loading={loading}
        emptyMessage="Nenhum post encontrado"
      />

      <Pagination
        meta={meta}
        onPageChange={(pagina) => fetchPosts(pagina, meta.limite)}
        onLimiteChange={(limite) => fetchPosts(1, limite)}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Deletar post"
        message="Esta acao nao pode ser desfeita. Deseja continuar?"
        confirmLabel="Deletar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </PageWrapper>
  )
}
