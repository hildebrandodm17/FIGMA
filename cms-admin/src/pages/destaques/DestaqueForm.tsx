import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { FormField } from '../../components/forms/FormField'
import { ImageUpload } from '../../components/forms/ImageUpload'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Toggle } from '../../components/ui/Toggle'
import { Button } from '../../components/ui/Button'
import destaqueService from '../../services/destaqueService'

const schema = z.object({
  titulo: z.string().min(1, 'Titulo e obrigatorio'),
  descricao: z.string().optional(),
  icone_url: z.string().optional(),
  icone_svg: z.string().optional(),
  ordem: z.coerce.number().int().min(0).default(0),
  ativo: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

export default function DestaqueForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(isEdit)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { titulo: '', descricao: '', icone_url: '', icone_svg: '', ordem: 0, ativo: true },
  })

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        const destaque = await destaqueService.obter(id)
        reset({
          titulo: destaque.titulo,
          descricao: destaque.descricao || '',
          icone_url: destaque.icone_url || '',
          icone_svg: destaque.icone_svg || '',
          ordem: destaque.ordem,
          ativo: destaque.ativo,
        })
      } catch {
        toast.error('Erro ao carregar destaque')
        navigate('/destaques')
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [id, isEdit, navigate, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      if (isEdit) {
        await destaqueService.atualizar(id, data)
        toast.success('Destaque atualizado com sucesso')
      } else {
        await destaqueService.criar(data)
        toast.success('Destaque criado com sucesso')
      }
      navigate('/destaques')
    } catch {
      toast.error(isEdit ? 'Erro ao atualizar destaque' : 'Erro ao criar destaque')
    } finally {
      setLoading(false)
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
    <PageWrapper
      title={isEdit ? 'Editar destaque' : 'Novo destaque'}
      actions={
        <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/destaques')}>
          Voltar
        </Button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-5">
          <FormField label="Titulo" required error={errors.titulo?.message}>
            <Input {...register('titulo')} placeholder="Ex: Qualidade garantida" />
          </FormField>

          <FormField label="Descricao" error={errors.descricao?.message}>
            <Textarea {...register('descricao')} placeholder="Descricao do destaque" rows={3} />
          </FormField>

          <Controller
            name="icone_url"
            control={control}
            render={({ field }) => (
              <FormField label="Icone (imagem)">
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  onRemove={() => field.onChange('')}
                />
              </FormField>
            )}
          />

          <FormField label="Icone SVG (codigo)" hint="Cole o codigo SVG do icone">
            <Textarea {...register('icone_svg')} placeholder="<svg>...</svg>" rows={4} />
          </FormField>

          <FormField label="Ordem" error={errors.ordem?.message}>
            <Input type="number" {...register('ordem')} min={0} />
          </FormField>

          <Controller
            name="ativo"
            control={control}
            render={({ field }) => (
              <Toggle enabled={field.value} onChange={field.onChange} label="Ativo" />
            )}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={loading}>
            {isEdit ? 'Salvar alteracoes' : 'Criar destaque'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/destaques')}>
            Cancelar
          </Button>
        </div>
      </form>
    </PageWrapper>
  )
}
