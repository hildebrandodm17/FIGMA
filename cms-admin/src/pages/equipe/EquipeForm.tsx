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
import equipeService from '../../services/equipeService'

const schema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  cargo: z.string().optional(),
  bio: z.string().optional(),
  foto_url: z.string().optional(),
  linkedin: z.string().optional(),
  email: z.string().email('E-mail invalido').optional().or(z.literal('')),
  ordem: z.coerce.number().int().min(0).default(0),
  ativo: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

export default function EquipeForm() {
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
    defaultValues: { nome: '', cargo: '', bio: '', foto_url: '', linkedin: '', email: '', ordem: 0, ativo: true },
  })

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        const membro = await equipeService.obter(id)
        reset({
          nome: membro.nome,
          cargo: membro.cargo || '',
          bio: membro.bio || '',
          foto_url: membro.foto_url || '',
          linkedin: membro.linkedin || '',
          email: membro.email || '',
          ordem: membro.ordem,
          ativo: membro.ativo,
        })
      } catch {
        toast.error('Erro ao carregar membro')
        navigate('/equipe')
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
        await equipeService.atualizar(id, data)
        toast.success('Membro atualizado com sucesso')
      } else {
        await equipeService.criar(data)
        toast.success('Membro adicionado com sucesso')
      }
      navigate('/equipe')
    } catch {
      toast.error(isEdit ? 'Erro ao atualizar membro' : 'Erro ao adicionar membro')
    } finally {
      setLoading(false)
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
    <PageWrapper
      title={isEdit ? 'Editar membro' : 'Novo membro'}
      actions={
        <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/equipe')}>
          Voltar
        </Button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-5">
          <FormField label="Nome" required error={errors.nome?.message}>
            <Input {...register('nome')} placeholder="Nome completo" />
          </FormField>

          <FormField label="Cargo" error={errors.cargo?.message}>
            <Input {...register('cargo')} placeholder="Ex: Diretor, Veterinario" />
          </FormField>

          <FormField label="Bio" error={errors.bio?.message}>
            <Textarea {...register('bio')} placeholder="Breve biografia do membro" rows={4} />
          </FormField>

          <Controller
            name="foto_url"
            control={control}
            render={({ field }) => (
              <FormField label="Foto">
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  onRemove={() => field.onChange('')}
                />
              </FormField>
            )}
          />

          <FormField label="LinkedIn" error={errors.linkedin?.message}>
            <Input {...register('linkedin')} placeholder="https://linkedin.com/in/..." />
          </FormField>

          <FormField label="E-mail" error={errors.email?.message}>
            <Input type="email" {...register('email')} placeholder="email@exemplo.com" />
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
            {isEdit ? 'Salvar alteracoes' : 'Adicionar membro'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/equipe')}>
            Cancelar
          </Button>
        </div>
      </form>
    </PageWrapper>
  )
}
