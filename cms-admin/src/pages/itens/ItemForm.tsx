import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { FormField } from '@/components/forms/FormField'
import { SlugField } from '@/components/forms/SlugField'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { MultiImageUpload } from '@/components/forms/MultiImageUpload'
import { SelectCategoria } from '@/components/forms/SelectCategoria'
import { RichEditor } from '@/components/editor/RichEditor'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import itemService from '@/services/itemService'

const itemSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(200),
  slug: z.string().min(1, 'Slug e obrigatorio'),
  tipo_label: z.string().max(100).optional().or(z.literal('')),
  resumo: z.string().max(500).optional().or(z.literal('')),
  descricao: z.string().optional().or(z.literal('')),
  imagem_url: z.string().optional().or(z.literal('')),
  imagens: z.array(z.string()).default([]),
  categoria_id: z.string().optional().or(z.literal('')),
  ordem: z.coerce.number().int().min(0).default(0),
  ativo: z.boolean().default(true),
  versao: z.number().default(1),
})

type ItemFormData = z.infer<typeof itemSchema>

export default function ItemForm() {
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
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      nome: '',
      slug: '',
      tipo_label: '',
      resumo: '',
      descricao: '',
      imagem_url: '',
      imagens: [],
      categoria_id: '',
      ordem: 0,
      ativo: true,
      versao: 1,
    },
  })

  useEffect(() => {
    if (!isEditing) return

    const fetchItem = async () => {
      setLoadingData(true)
      try {
        const item = await itemService.obter(id!)
        reset({
          nome: item.nome,
          slug: item.slug,
          tipo_label: item.tipo_label || '',
          resumo: item.resumo || '',
          descricao: item.descricao || '',
          imagem_url: item.imagem_url || '',
          imagens: item.imagens || [],
          categoria_id: item.categoria?.id || '',
          ordem: item.ordem,
          ativo: item.ativo,
          versao: item.versao,
        })
      } catch {
        toast.error('Erro ao carregar item')
        navigate('/itens')
      } finally {
        setLoadingData(false)
      }
    }

    fetchItem()
  }, [id, isEditing, navigate, reset])

  const onSubmit = async (data: ItemFormData) => {
    setSaving(true)
    try {
      const payload = {
        ...data,
        categoria_id: data.categoria_id || undefined,
      }

      if (isEditing) {
        await itemService.atualizar(id!, payload)
        toast.success('Item atualizado com sucesso')
      } else {
        await itemService.criar(payload)
        toast.success('Item criado com sucesso')
      }
      navigate('/itens')
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error('Conflito: o item foi alterado por outro usuario. Recarregue e tente novamente.')
      } else {
        toast.error(isEditing ? 'Erro ao atualizar item' : 'Erro ao criar item')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <PageWrapper title="Carregando...">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-[#1A1A1A] rounded-lg" />
          ))}
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title={isEditing ? 'Editar Item' : 'Novo Item'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        <FormField label="Nome" required error={errors.nome?.message}>
          <Input {...register('nome')} placeholder="Nome do item" />
        </FormField>

        <SlugField
          value={watch('slug')}
          onChange={(slug) => setValue('slug', slug)}
          baseValue={watch('nome')}
        />

        <FormField label="Tipo / Label" error={errors.tipo_label?.message} hint="Ex: Servico, Produto, Procedimento">
          <Input {...register('tipo_label')} placeholder="Ex: Servico" />
        </FormField>

        <FormField label="Resumo" error={errors.resumo?.message}>
          <Textarea
            {...register('resumo')}
            placeholder="Breve resumo do item"
            rows={3}
            maxLength={500}
            showCount
            value={watch('resumo')}
          />
        </FormField>

        <FormField label="Descricao">
          <RichEditor
            content={watch('descricao') || ''}
            onChange={(content) => setValue('descricao', content)}
          />
        </FormField>

        <FormField label="Imagem Principal">
          <ImageUpload
            value={watch('imagem_url')}
            onChange={(url) => setValue('imagem_url', url)}
            onRemove={() => setValue('imagem_url', '')}
          />
        </FormField>

        <FormField label="Galeria de Imagens">
          <MultiImageUpload
            value={watch('imagens')}
            onChange={(urls) => setValue('imagens', urls)}
          />
        </FormField>

        <FormField label="Categoria">
          <SelectCategoria
            tipo="item"
            value={watch('categoria_id')}
            onChange={(id) => setValue('categoria_id', id)}
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
          <Button type="button" variant="secondary" onClick={() => navigate('/itens')}>
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
