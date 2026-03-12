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
import depoimentoService from '../../services/depoimentoService'

const schema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  cargo: z.string().optional(),
  empresa: z.string().optional(),
  texto: z.string().min(1, 'Texto do depoimento e obrigatorio'),
  foto_url: z.string().optional(),
  nota: z.coerce.number().int().min(1).max(5).optional(),
  ordem: z.coerce.number().int().min(0).default(0),
  ativo: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

export default function DepoimentoForm() {
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
    defaultValues: { nome: '', cargo: '', empresa: '', texto: '', foto_url: '', nota: undefined, ordem: 0, ativo: true },
  })

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        const dep = await depoimentoService.obter(id)
        reset({
          nome: dep.nome,
          cargo: dep.cargo || '',
          empresa: dep.empresa || '',
          texto: dep.texto,
          foto_url: dep.foto_url || '',
          nota: dep.nota ?? undefined,
          ordem: dep.ordem,
          ativo: dep.ativo,
        })
      } catch {
        toast.error('Erro ao carregar depoimento')
        navigate('/depoimentos')
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
        await depoimentoService.atualizar(id, data)
        toast.success('Depoimento atualizado com sucesso')
      } else {
        await depoimentoService.criar(data)
        toast.success('Depoimento criado com sucesso')
      }
      navigate('/depoimentos')
    } catch {
      toast.error(isEdit ? 'Erro ao atualizar depoimento' : 'Erro ao criar depoimento')
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
      title={isEdit ? 'Editar depoimento' : 'Novo depoimento'}
      actions={
        <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/depoimentos')}>
          Voltar
        </Button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-5">
          <FormField label="Nome" required error={errors.nome?.message}>
            <Input {...register('nome')} placeholder="Nome do cliente" />
          </FormField>

          <FormField label="Cargo" error={errors.cargo?.message}>
            <Input {...register('cargo')} placeholder="Ex: CEO, Gerente" />
          </FormField>

          <FormField label="Empresa" error={errors.empresa?.message}>
            <Input {...register('empresa')} placeholder="Nome da empresa do cliente" />
          </FormField>

          <FormField label="Texto do depoimento" required error={errors.texto?.message}>
            <Textarea {...register('texto')} placeholder="O que o cliente disse..." rows={5} />
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

          <FormField label="Nota (1 a 5)" error={errors.nota?.message} hint="Avaliacao do cliente de 1 a 5">
            <Input type="number" {...register('nota')} min={1} max={5} placeholder="5" />
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
            {isEdit ? 'Salvar alteracoes' : 'Criar depoimento'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/depoimentos')}>
            Cancelar
          </Button>
        </div>
      </form>
    </PageWrapper>
  )
}
