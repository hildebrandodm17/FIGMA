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
import usuarioService from '../../services/usuarioService'
import type { Usuario, PaginationMeta } from '../../types'

const roleLabel: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  usuario: 'Usuario',
}

const roleVariant: Record<string, 'active' | 'draft' | 'published'> = {
  superadmin: 'published',
  admin: 'active',
  usuario: 'draft',
}

export default function UsuarioList() {
  const navigate = useNavigate()

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, pagina: 1, limite: 20, paginas: 1 })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsuarios = useCallback(async (pagina = 1, limite = 20) => {
    setLoading(true)
    try {
      const res = await usuarioService.listar({ pagina, limite })
      setUsuarios(res.data)
      setMeta(res.meta)
    } catch {
      toast.error('Erro ao carregar usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsuarios()
  }, [fetchUsuarios])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await usuarioService.deletar(deleteId)
      toast.success('Usuario deletado com sucesso')
      setDeleteId(null)
      fetchUsuarios(meta.pagina, meta.limite)
    } catch {
      toast.error('Erro ao deletar usuario')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Usuario>[] = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Papel',
      render: (item) => (
        <Badge variant={roleVariant[item.role] || 'draft'}>
          {roleLabel[item.role] || item.role}
        </Badge>
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
          onEdit={() => navigate(`/usuarios/${item.id}`)}
          onDelete={() => setDeleteId(item.id)}
        />
      ),
    },
  ]

  return (
    <PageWrapper
      title="Usuarios"
      subtitle="Gerencie os usuarios da empresa"
      actions={
        <Button icon={<Plus size={16} />} onClick={() => navigate('/usuarios/novo')}>
          Novo usuario
        </Button>
      }
    >
      <DataTable columns={columns} data={usuarios} loading={loading} emptyMessage="Nenhum usuario cadastrado" />
      <Pagination meta={meta} onPageChange={(p) => fetchUsuarios(p, meta.limite)} onLimiteChange={(l) => fetchUsuarios(1, l)} />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Deletar usuario"
        message="Esta acao nao pode ser desfeita. Deseja continuar?"
        confirmLabel={deleting ? 'Deletando...' : 'Deletar'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </PageWrapper>
  )
}
