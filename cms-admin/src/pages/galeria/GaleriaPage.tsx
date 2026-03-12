import { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Play, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/forms/FormField'
import { ImageUpload } from '../../components/forms/ImageUpload'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { usePermissaoModulo } from '../../hooks/usePermissao'
import galeriaService from '../../services/galeriaService'
import type { GaleriaItem } from '../../types'

const schema = z.object({
  titulo: z.string().optional(),
  url: z.string().min(1, 'URL e obrigatoria'),
  tipo: z.enum(['foto', 'video']),
  descricao: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function GaleriaPage() {
  const { podeCriar, podeDeletar } = usePermissaoModulo('galeria')

  const [items, setItems] = useState<GaleriaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { titulo: '', url: '', tipo: 'foto', descricao: '' },
  })

  const tipoAtual = watch('tipo')

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await galeriaService.listar({ limite: 100 })
      setItems(res.data)
    } catch {
      toast.error('Erro ao carregar galeria')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      await galeriaService.criar({ ...data, ordem: items.length, ativo: true })
      toast.success('Item adicionado a galeria')
      setModalOpen(false)
      reset()
      fetchItems()
    } catch {
      toast.error('Erro ao adicionar item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await galeriaService.deletar(deleteId)
      toast.success('Item removido da galeria')
      setDeleteId(null)
      fetchItems()
    } catch {
      toast.error('Erro ao remover item')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PageWrapper
      title="Galeria"
      subtitle="Fotos e videos"
      actions={
        podeCriar ? (
          <Button icon={<Plus size={16} />} onClick={() => { reset(); setModalOpen(true) }}>
            Adicionar item
          </Button>
        ) : undefined
      }
    >
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg flex flex-col items-center justify-center py-20 text-[#9CA3AF]">
          <ImageIcon size={40} className="mb-3 opacity-50" />
          <p className="text-sm">Nenhum item na galeria</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden"
            >
              {item.tipo === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-[#141414]">
                  <Play size={32} className="text-[#9CA3AF]" />
                </div>
              ) : (
                <img src={item.url} alt={item.titulo || 'Galeria'} className="w-full h-full object-cover" />
              )}

              {/* Title overlay */}
              {item.titulo && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                  <p className="text-xs text-white truncate">{item.titulo}</p>
                </div>
              )}

              {/* Delete button */}
              {podeDeletar && (
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add item modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Adicionar item">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Titulo">
            <Input {...register('titulo')} placeholder="Titulo do item (opcional)" />
          </FormField>

          <FormField label="Tipo">
            <Select {...register('tipo')}>
              <option value="foto">Foto</option>
              <option value="video">Video</option>
            </Select>
          </FormField>

          {tipoAtual === 'foto' ? (
            <Controller
              name="url"
              control={control}
              render={({ field }) => (
                <FormField label="Imagem" required error={errors.url?.message}>
                  <ImageUpload value={field.value} onChange={field.onChange} onRemove={() => field.onChange('')} />
                </FormField>
              )}
            />
          ) : (
            <FormField label="URL do video" required error={errors.url?.message}>
              <Input {...register('url')} placeholder="https://youtube.com/watch?v=..." />
            </FormField>
          )}

          <FormField label="Descricao">
            <Textarea {...register('descricao')} placeholder="Descricao do item (opcional)" rows={2} />
          </FormField>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              Adicionar
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Remover item"
        message="Deseja remover este item da galeria?"
        confirmLabel={deleting ? 'Removendo...' : 'Remover'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </PageWrapper>
  )
}
