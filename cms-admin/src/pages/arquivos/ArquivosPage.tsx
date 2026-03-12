import { useState, useEffect, useCallback, useRef } from 'react'
import { Upload, Trash2, FileText, Image as ImageIcon, File } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/table/Pagination'
import { usePermissaoModulo } from '../../hooks/usePermissao'
import arquivoService from '../../services/arquivoService'
import { formatFileSize } from '../../utils/formatFileSize'
import { formatDate } from '../../utils/formatDate'
import type { Arquivo, PaginationMeta } from '../../types'

type FiltroTipo = 'todos' | 'image' | 'document'

function isImage(mime?: string | null) {
  return mime?.startsWith('image/') ?? false
}

function getFileIcon(mime?: string | null) {
  if (isImage(mime)) return <ImageIcon size={24} className="text-green-500" />
  if (mime?.includes('pdf')) return <FileText size={24} className="text-red-500" />
  return <File size={24} className="text-[#9CA3AF]" />
}

export default function ArquivosPage() {
  const { podeCriar, podeDeletar } = usePermissaoModulo('arquivos')
  const inputRef = useRef<HTMLInputElement>(null)

  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, pagina: 1, limite: 20, paginas: 1 })
  const [filtro, setFiltro] = useState<FiltroTipo>('todos')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchArquivos = useCallback(async (pagina = 1, limite = 20, tipo?: string) => {
    setLoading(true)
    try {
      const params: Record<string, any> = { pagina, limite }
      if (tipo && tipo !== 'todos') params.tipo = tipo
      const res = await arquivoService.listar(params)
      setArquivos(res.data)
      setMeta(res.meta)
    } catch {
      toast.error('Erro ao carregar arquivos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchArquivos(1, 20, filtro)
  }, [fetchArquivos, filtro])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo deve ter no maximo 10MB')
      return
    }
    setUploading(true)
    try {
      await arquivoService.upload(file)
      toast.success('Arquivo enviado com sucesso')
      fetchArquivos(meta.pagina, meta.limite, filtro)
    } catch {
      toast.error('Erro ao enviar arquivo')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await arquivoService.deletar(deleteId)
      toast.success('Arquivo deletado com sucesso')
      setDeleteId(null)
      fetchArquivos(meta.pagina, meta.limite, filtro)
    } catch {
      toast.error('Erro ao deletar arquivo')
    } finally {
      setDeleting(false)
    }
  }

  const filtros: { key: FiltroTipo; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'image', label: 'Imagens' },
    { key: 'document', label: 'Documentos' },
  ]

  return (
    <PageWrapper
      title="Arquivos"
      subtitle="Gerenciador de midias"
      actions={
        podeCriar ? (
          <>
            <Button
              icon={<Upload size={16} />}
              onClick={() => inputRef.current?.click()}
              loading={uploading}
            >
              Upload
            </Button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleUpload}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.svg"
            />
          </>
        ) : undefined
      }
    >
      {/* Filter */}
      <div className="flex items-center gap-2">
        {filtros.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtro === f.key
                ? 'bg-green-500/20 text-green-500'
                : 'text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#1A1A1A]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : arquivos.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg flex flex-col items-center justify-center py-20 text-[#9CA3AF]">
          <File size={40} className="mb-3 opacity-50" />
          <p className="text-sm">Nenhum arquivo encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {arquivos.map((arq) => (
            <div
              key={arq.id}
              className="group relative bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden"
            >
              {/* Thumbnail or icon */}
              <div className="aspect-square flex items-center justify-center">
                {isImage(arq.mime_type) ? (
                  <img src={arq.url} alt={arq.nome_original || arq.nome_arquivo} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    {getFileIcon(arq.mime_type)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="px-3 py-2 border-t border-[#2A2A2A]">
                <p className="text-xs text-[#F5F5F5] truncate">{arq.nome_original || arq.nome_arquivo}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[#9CA3AF]">{formatFileSize(arq.tamanho_bytes)}</span>
                  <span className="text-xs text-[#9CA3AF]">{formatDate(arq.created_at)}</span>
                </div>
              </div>

              {/* Delete button */}
              {podeDeletar && (
                <button
                  onClick={() => setDeleteId(arq.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination meta={meta} onPageChange={(p) => fetchArquivos(p, meta.limite, filtro)} onLimiteChange={(l) => fetchArquivos(1, l, filtro)} />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Deletar arquivo"
        message="Esta acao nao pode ser desfeita. Deseja continuar?"
        confirmLabel={deleting ? 'Deletando...' : 'Deletar'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </PageWrapper>
  )
}
