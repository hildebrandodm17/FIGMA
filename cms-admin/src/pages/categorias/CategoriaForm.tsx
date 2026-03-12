import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { FormField } from '@/components/forms/FormField'
import { SlugField } from '@/components/forms/SlugField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import categoriaService from '@/services/categoriaService'

const categoriaSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(100),
  slug: z.string().min(1, 'Slug e obrigatorio'),
  tipo: z.string().min(1, 'Tipo e obrigatorio'),
  ativo: z.boolean().default(true),
})

type CategoriaFormData = z.infer<typeof categoriaSchema>

export default function CategoriaForm() {
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
  } = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: '',
      slug: '',
      tipo: 'post',
      ativo: true,
    },
  })

  useEffect(() => {
    if (!isEditing) return

    const fetchCategoria = async () => {
      setLoadingData(true)
      try {
        const categoria = await categoriaService.obter(id!)
        reset({
          nome: categoria.nome,
          slug: categoria.slug,
          tipo: categoria.tipo,
          ativo: categoria.ativo,
        })
      } catch {
        toast.error('Erro ao carregar categoria')
        navigate('/categorias')
      } finally {
        setLoadingData(false)
      }
    }

    fetchCategoria()
  }, [id, isEditing, navigate, reset])

  const onSubmit = async (data: CategoriaFormData) => {
    setSaving(true)
    try {
      if (isEditing) {
        await categoriaService.atualizar(id!, data)
        toast.success('Categoria atualizada com sucesso')
      } else {
        await categoriaService.criar(data)
        toast.success('Categoria criada com sucesso')
      }
      navigate('/categorias')
    } catch {
      toast.error(isEditing ? 'Erro ao atualizar categoria' : 'Erro ao criar categoria')
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <PageWrapper title="Carregando...">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-[#1A1A1A] rounded-lg" />
          ))}
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title={isEditing ? 'Editar Categoria' : 'Nova Categoria'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <FormField label="Nome" required error={errors.nome?.message}>
          <Input {...register('nome')} placeholder="Nome da categoria" />
        </FormField>

        <SlugField
          value={watch('slug')}
          onChange={(slug) => setValue('slug', slug)}
          baseValue={watch('nome')}
        />

        <FormField label="Tipo" required error={errors.tipo?.message}>
          <Select {...register('tipo')}>
            <option value="post">Post</option>
            <option value="item">Item</option>
          </Select>
        </FormField>

        <div>
          <Toggle
            enabled={watch('ativo')}
            onChange={(val) => setValue('ativo', val)}
            label="Ativa"
          />
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-[#2A2A2A]">
          <Button type="button" variant="secondary" onClick={() => navigate('/categorias')}>
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
