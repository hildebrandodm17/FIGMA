import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { FormField } from '../../components/forms/FormField'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Toggle } from '../../components/ui/Toggle'
import { Button } from '../../components/ui/Button'
import faqService from '../../services/faqService'

const schema = z.object({
  pergunta: z.string().min(1, 'Pergunta e obrigatoria'),
  resposta: z.string().min(1, 'Resposta e obrigatoria'),
  ordem: z.coerce.number().int().min(0).default(0),
  ativo: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

export default function FaqForm() {
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
    defaultValues: { pergunta: '', resposta: '', ordem: 0, ativo: true },
  })

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        const faq = await faqService.obter(id)
        reset({
          pergunta: faq.pergunta,
          resposta: faq.resposta,
          ordem: faq.ordem,
          ativo: faq.ativo,
        })
      } catch {
        toast.error('Erro ao carregar FAQ')
        navigate('/faq')
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
        await faqService.atualizar(id, data)
        toast.success('FAQ atualizada com sucesso')
      } else {
        await faqService.criar(data)
        toast.success('FAQ criada com sucesso')
      }
      navigate('/faq')
    } catch {
      toast.error(isEdit ? 'Erro ao atualizar FAQ' : 'Erro ao criar FAQ')
    } finally {
      setLoading(false)
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
    <PageWrapper
      title={isEdit ? 'Editar FAQ' : 'Nova pergunta'}
      actions={
        <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/faq')}>
          Voltar
        </Button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-5">
          <FormField label="Pergunta" required error={errors.pergunta?.message}>
            <Input {...register('pergunta')} placeholder="Ex: Como funciona o atendimento?" />
          </FormField>

          <FormField label="Resposta" required error={errors.resposta?.message}>
            <Textarea {...register('resposta')} placeholder="Resposta da pergunta" rows={5} />
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
            {isEdit ? 'Salvar alteracoes' : 'Criar FAQ'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/faq')}>
            Cancelar
          </Button>
        </div>
      </form>
    </PageWrapper>
  )
}
