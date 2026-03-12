import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { FormField } from '@/components/forms/FormField'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import bannerService from '@/services/bannerService'

const bannerSchema = z.object({
  titulo: z.string().max(200).optional().or(z.literal('')),
  subtitulo: z.string().max(200).optional().or(z.literal('')),
  texto: z.string().max(500).optional().or(z.literal('')),
  label_cta: z.string().max(100).optional().or(z.literal('')),
  link_cta: z.string().max(500).optional().or(z.literal('')),
  imagem_url: z.string().optional().or(z.literal('')),
  imagem_mobile: z.string().optional().or(z.literal('')),
  ordem: z.coerce.number().int().min(0).default(0),
  ativo: z.boolean().default(true),
})

type BannerFormData = z.infer<typeof bannerSchema>

export default function BannerForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id && id !== 'novo'

  const [loadingData, setLoadingData] = useState(false)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      titulo: '',
      subtitulo: '',
      texto: '',
      label_cta: '',
      link_cta: '',
      imagem_url: '',
      imagem_mobile: '',
      ordem: 0,
      ativo: true,
    },
  })

  useEffect(() => {
    if (!isEditing) return

    const fetchBanner = async () => {
      setLoadingData(true)
      try {
        const banner = await bannerService.obter(id!)
        reset({
          titulo: banner.titulo || '',
          subtitulo: banner.subtitulo || '',
          texto: banner.texto || '',
          label_cta: banner.label_cta || '',
          link_cta: banner.link_cta || '',
          imagem_url: banner.imagem_url || '',
          imagem_mobile: banner.imagem_mobile || '',
          ordem: banner.ordem,
          ativo: banner.ativo,
        })
      } catch {
        toast.error('Erro ao carregar banner')
        navigate('/banners')
      } finally {
        setLoadingData(false)
      }
    }

    fetchBanner()
  }, [id, isEditing, navigate, reset])

  const onSubmit = async (data: BannerFormData) => {
    setSaving(true)
    try {
      if (isEditing) {
        await bannerService.atualizar(id!, data)
        toast.success('Banner atualizado com sucesso')
      } else {
        await bannerService.criar(data)
        toast.success('Banner criado com sucesso')
      }
      navigate('/banners')
    } catch {
      toast.error(isEditing ? 'Erro ao atualizar banner' : 'Erro ao criar banner')
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <PageWrapper title="Carregando...">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-[#1A1A1A] rounded-lg" />
          ))}
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title={isEditing ? 'Editar Banner' : 'Novo Banner'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <FormField label="Titulo" error={errors.titulo?.message}>
          <Input {...register('titulo')} placeholder="Titulo do banner" />
        </FormField>

        <FormField label="Subtitulo" error={errors.subtitulo?.message}>
          <Input {...register('subtitulo')} placeholder="Subtitulo do banner" />
        </FormField>

        <FormField label="Texto" error={errors.texto?.message}>
          <Textarea
            {...register('texto')}
            placeholder="Texto do banner"
            rows={3}
            maxLength={500}
            showCount
            value={watch('texto')}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Label do CTA" error={errors.label_cta?.message}>
            <Input {...register('label_cta')} placeholder="Ex: Saiba mais" />
          </FormField>

          <FormField label="Link do CTA" error={errors.link_cta?.message}>
            <Input {...register('link_cta')} placeholder="https://..." />
          </FormField>
        </div>

        <FormField label="Imagem Desktop">
          <ImageUpload
            value={watch('imagem_url')}
            onChange={(url) => setValue('imagem_url', url)}
            onRemove={() => setValue('imagem_url', '')}
          />
        </FormField>

        <FormField label="Imagem Mobile">
          <ImageUpload
            value={watch('imagem_mobile')}
            onChange={(url) => setValue('imagem_mobile', url)}
            onRemove={() => setValue('imagem_mobile', '')}
          />
        </FormField>

        <FormField label="Ordem" error={errors.ordem?.message}>
          <Input {...register('ordem')} type="number" min={0} placeholder="0" />
        </FormField>

        <div>
          <Toggle
            enabled={watch('ativo')}
            onChange={(val) => setValue('ativo', val)}
            label="Ativo"
          />
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-[#2A2A2A]">
          <Button type="button" variant="secondary" onClick={() => navigate('/banners')}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Salvar
          </Button>
        </div>
      </form>
    </PageWrapper>
  )
}
