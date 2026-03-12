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
import { SelectCategoria } from '@/components/forms/SelectCategoria'
import { RichEditor } from '@/components/editor/RichEditor'
import { SeoFields } from '@/components/seo/SeoFields'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import postService from '@/services/postService'

const postSchema = z.object({
  tipo: z.string().min(1, 'Tipo e obrigatorio'),
  titulo: z.string().min(1, 'Titulo e obrigatorio').max(200),
  slug: z.string().min(1, 'Slug e obrigatorio'),
  resumo: z.string().max(500).optional().or(z.literal('')),
  conteudo: z.string().optional().or(z.literal('')),
  imagem_capa: z.string().optional().or(z.literal('')),
  categoria_id: z.string().optional().or(z.literal('')),
  autor: z.string().max(100).optional().or(z.literal('')),
  publicado: z.boolean().default(false),
  publicado_em: z.string().optional().or(z.literal('')),
  meta_title: z.string().max(70).optional().or(z.literal('')),
  meta_desc: z.string().max(160).optional().or(z.literal('')),
  og_image: z.string().optional().or(z.literal('')),
  og_title: z.string().max(200).optional().or(z.literal('')),
  canonical_url: z.string().max(500).optional().or(z.literal('')),
  indexavel: z.boolean().default(true),
  versao: z.number().default(1),
})

type PostFormData = z.infer<typeof postSchema>

const TIPOS = [
  { value: 'post', label: 'Post' },
  { value: 'noticia', label: 'Noticia' },
  { value: 'artigo', label: 'Artigo' },
  { value: 'case', label: 'Case' },
]

export default function PostForm() {
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
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      tipo: 'post',
      titulo: '',
      slug: '',
      resumo: '',
      conteudo: '',
      imagem_capa: '',
      categoria_id: '',
      autor: '',
      publicado: false,
      publicado_em: '',
      meta_title: '',
      meta_desc: '',
      og_image: '',
      og_title: '',
      canonical_url: '',
      indexavel: true,
      versao: 1,
    },
  })

  useEffect(() => {
    if (!isEditing) return

    const fetchPost = async () => {
      setLoadingData(true)
      try {
        const post = await postService.obter(id!)
        reset({
          tipo: post.tipo,
          titulo: post.titulo,
          slug: post.slug,
          resumo: post.resumo || '',
          conteudo: post.conteudo || '',
          imagem_capa: post.imagem_capa || '',
          categoria_id: post.categoria?.id || '',
          autor: post.autor || '',
          publicado: post.publicado,
          publicado_em: post.publicado_em ? post.publicado_em.slice(0, 10) : '',
          meta_title: post.meta_title || '',
          meta_desc: post.meta_desc || '',
          og_image: post.og_image || '',
          og_title: post.og_title || '',
          canonical_url: post.canonical_url || '',
          indexavel: post.indexavel,
          versao: post.versao,
        })
      } catch {
        toast.error('Erro ao carregar post')
        navigate('/posts')
      } finally {
        setLoadingData(false)
      }
    }

    fetchPost()
  }, [id, isEditing, navigate, reset])

  const onSubmit = async (data: PostFormData) => {
    setSaving(true)
    try {
      const payload = {
        ...data,
        categoria_id: data.categoria_id || undefined,
        publicado_em: data.publicado_em || undefined,
      }

      if (isEditing) {
        await postService.atualizar(id!, payload)
        toast.success('Post atualizado com sucesso')
      } else {
        await postService.criar(payload)
        toast.success('Post criado com sucesso')
      }
      navigate('/posts')
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error('Conflito: o post foi alterado por outro usuario. Recarregue e tente novamente.')
      } else {
        toast.error(isEditing ? 'Erro ao atualizar post' : 'Erro ao criar post')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <PageWrapper title="Carregando...">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-[#1A1A1A] rounded-lg" />
          ))}
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title={isEditing ? 'Editar Post' : 'Novo Post'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Tipo" required error={errors.tipo?.message}>
            <Select {...register('tipo')}>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Autor" error={errors.autor?.message}>
            <Input {...register('autor')} placeholder="Nome do autor" />
          </FormField>
        </div>

        <FormField label="Titulo" required error={errors.titulo?.message}>
          <Input {...register('titulo')} placeholder="Titulo do post" />
        </FormField>

        <SlugField
          value={watch('slug')}
          onChange={(slug) => setValue('slug', slug)}
          baseValue={watch('titulo')}
        />

        <FormField label="Resumo" error={errors.resumo?.message}>
          <Textarea
            {...register('resumo')}
            placeholder="Breve resumo do post"
            rows={3}
            maxLength={500}
            showCount
            value={watch('resumo')}
          />
        </FormField>

        <FormField label="Conteudo">
          <RichEditor
            content={watch('conteudo') || ''}
            onChange={(content) => setValue('conteudo', content)}
          />
        </FormField>

        <FormField label="Imagem de Capa">
          <ImageUpload
            value={watch('imagem_capa')}
            onChange={(url) => setValue('imagem_capa', url)}
            onRemove={() => setValue('imagem_capa', '')}
          />
        </FormField>

        <FormField label="Categoria">
          <SelectCategoria
            tipo="post"
            value={watch('categoria_id')}
            onChange={(id) => setValue('categoria_id', id)}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Toggle
              enabled={watch('publicado')}
              onChange={(val) => setValue('publicado', val)}
              label="Publicado"
            />
          </div>

          <FormField label="Data de publicacao" error={errors.publicado_em?.message}>
            <Input {...register('publicado_em')} type="date" />
          </FormField>
        </div>

        <SeoFields
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />

        <div className="flex items-center gap-3 pt-4 border-t border-[#2A2A2A]">
          <Button type="button" variant="secondary" onClick={() => navigate('/posts')}>
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
