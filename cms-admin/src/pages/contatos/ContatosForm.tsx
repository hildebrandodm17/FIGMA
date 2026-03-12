import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { FormField } from '../../components/forms/FormField'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Button } from '../../components/ui/Button'
import contatoService from '../../services/contatoService'

const schema = z.object({
  telefone: z.string().optional(),
  telefone_2: z.string().optional(),
  email: z.string().email('E-mail invalido').optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  whatsapp_hover: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2, 'Use a sigla do estado (2 caracteres)').optional().or(z.literal('')),
  cep: z.string().optional(),
  mapa_embed: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  youtube: z.string().optional(),
  tiktok: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function ContatosForm() {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      telefone: '', telefone_2: '', email: '', whatsapp: '', whatsapp_hover: '',
      endereco: '', cidade: '', estado: '', cep: '', mapa_embed: '',
      facebook: '', instagram: '', linkedin: '', youtube: '', tiktok: '',
    },
  })

  useEffect(() => {
    const load = async () => {
      try {
        const contato = await contatoService.obter()
        reset({
          telefone: contato.telefone || '',
          telefone_2: contato.telefone_2 || '',
          email: contato.email || '',
          whatsapp: contato.whatsapp || '',
          whatsapp_hover: contato.whatsapp_hover || '',
          endereco: contato.endereco || '',
          cidade: contato.cidade || '',
          estado: contato.estado || '',
          cep: contato.cep || '',
          mapa_embed: contato.mapa_embed || '',
          facebook: contato.facebook || '',
          instagram: contato.instagram || '',
          linkedin: contato.linkedin || '',
          youtube: contato.youtube || '',
          tiktok: contato.tiktok || '',
        })
      } catch {
        // First time - no data yet, keep defaults
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await contatoService.atualizar(data)
      toast.success('Contatos atualizados com sucesso')
    } catch {
      toast.error('Erro ao atualizar contatos')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <PageWrapper title="Contatos">
        <div className="animate-pulse space-y-4 max-w-2xl">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-[#1A1A1A] rounded-lg" />
          ))}
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Contatos" subtitle="Informacoes de contato da empresa">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        {/* Telefones */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-5">
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Telefones</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Telefone" error={errors.telefone?.message}>
              <Input {...register('telefone')} placeholder="(11) 1234-5678" />
            </FormField>
            <FormField label="Telefone 2" error={errors.telefone_2?.message}>
              <Input {...register('telefone_2')} placeholder="(11) 1234-5678" />
            </FormField>
          </div>

          <FormField label="E-mail" error={errors.email?.message}>
            <Input type="email" {...register('email')} placeholder="contato@empresa.com" />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="WhatsApp" error={errors.whatsapp?.message}>
              <Input {...register('whatsapp')} placeholder="5511999999999" />
            </FormField>
            <FormField label="WhatsApp hover (texto)" error={errors.whatsapp_hover?.message}>
              <Input {...register('whatsapp_hover')} placeholder="Fale conosco" />
            </FormField>
          </div>
        </div>

        {/* Endereco */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-5">
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Endereco</h3>

          <FormField label="Endereco" error={errors.endereco?.message}>
            <Textarea {...register('endereco')} placeholder="Rua, numero, bairro" rows={2} />
          </FormField>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <FormField label="Cidade" error={errors.cidade?.message}>
              <Input {...register('cidade')} placeholder="Sao Paulo" />
            </FormField>
            <FormField label="Estado" error={errors.estado?.message}>
              <Input {...register('estado')} placeholder="SP" maxLength={2} />
            </FormField>
            <FormField label="CEP" error={errors.cep?.message}>
              <Input {...register('cep')} placeholder="00000-000" />
            </FormField>
          </div>

          <FormField label="Mapa embed (iframe)" error={errors.mapa_embed?.message} hint="Cole o codigo embed do Google Maps">
            <Textarea {...register('mapa_embed')} placeholder='<iframe src="https://maps.google.com/...">' rows={3} />
          </FormField>
        </div>

        {/* Redes sociais */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-5">
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Redes sociais</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Facebook" error={errors.facebook?.message}>
              <Input {...register('facebook')} placeholder="https://facebook.com/..." />
            </FormField>
            <FormField label="Instagram" error={errors.instagram?.message}>
              <Input {...register('instagram')} placeholder="https://instagram.com/..." />
            </FormField>
            <FormField label="LinkedIn" error={errors.linkedin?.message}>
              <Input {...register('linkedin')} placeholder="https://linkedin.com/company/..." />
            </FormField>
            <FormField label="YouTube" error={errors.youtube?.message}>
              <Input {...register('youtube')} placeholder="https://youtube.com/@..." />
            </FormField>
            <FormField label="TikTok" error={errors.tiktok?.message}>
              <Input {...register('tiktok')} placeholder="https://tiktok.com/@..." />
            </FormField>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={loading}>
            Salvar contatos
          </Button>
        </div>
      </form>
    </PageWrapper>
  )
}
