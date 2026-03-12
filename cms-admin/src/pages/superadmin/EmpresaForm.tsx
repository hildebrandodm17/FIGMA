import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { FormField } from '../../components/forms/FormField'
import { SlugField } from '../../components/forms/SlugField'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import empresaService from '../../services/empresaService'

const createSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  slug: z.string().min(1, 'Slug e obrigatorio'),
  dominio: z.string().optional(),
  plano: z.enum(['basico', 'profissional', 'enterprise']),
  admin_nome: z.string().min(1, 'Nome do admin e obrigatorio'),
  admin_email: z.string().email('E-mail invalido'),
  admin_senha: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
})

const editSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  slug: z.string().optional(),
  dominio: z.string().optional(),
  plano: z.enum(['basico', 'profissional', 'enterprise']),
  r2_bucket_name: z.string().optional(),
  r2_public_url: z.string().optional(),
  r2_access_key_id: z.string().optional(),
  r2_secret_access_key: z.string().optional(),
  webhook_leads: z.string().optional(),
})

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>

export default function EmpresaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(isEdit)

  // Create form
  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      nome: '', slug: '', dominio: '', plano: 'basico',
      admin_nome: '', admin_email: '', admin_senha: '',
    },
  })

  // Edit form
  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      nome: '', slug: '', dominio: '', plano: 'basico',
      r2_bucket_name: '', r2_public_url: '', r2_access_key_id: '',
      r2_secret_access_key: '', webhook_leads: '',
    },
  })

  const form = isEdit ? editForm : createForm

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        const empresa = await empresaService.obter(id)
        editForm.reset({
          nome: empresa.nome,
          slug: empresa.slug,
          dominio: empresa.dominio || '',
          plano: empresa.plano as 'basico' | 'profissional' | 'enterprise',
          r2_bucket_name: empresa.r2_bucket_name || '',
          r2_public_url: empresa.r2_public_url || '',
          r2_access_key_id: '',
          r2_secret_access_key: '',
          webhook_leads: empresa.webhook_leads || '',
        })
      } catch {
        toast.error('Erro ao carregar empresa')
        navigate('/superadmin/empresas')
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [id, isEdit, navigate, editForm])

  const onSubmitCreate = async (data: CreateFormData) => {
    setLoading(true)
    try {
      await empresaService.criar(data)
      toast.success('Empresa criada com sucesso')
      navigate('/superadmin/empresas')
    } catch {
      toast.error('Erro ao criar empresa')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitEdit = async (data: EditFormData) => {
    setLoading(true)
    try {
      // Only send non-empty R2 credentials
      const payload: any = { ...data }
      if (!payload.r2_access_key_id) delete payload.r2_access_key_id
      if (!payload.r2_secret_access_key) delete payload.r2_secret_access_key
      await empresaService.atualizar(id!, payload)
      toast.success('Empresa atualizada com sucesso')
      navigate('/superadmin/empresas')
    } catch {
      toast.error('Erro ao atualizar empresa')
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

  if (isEdit) {
    return (
      <PageWrapper
        title="Editar empresa"
        actions={
          <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/superadmin/empresas')}>
            Voltar
          </Button>
        }
      >
        <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="max-w-2xl space-y-6">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-5">
            <FormField label="Nome" required error={editForm.formState.errors.nome?.message}>
              <Input {...editForm.register('nome')} placeholder="Nome da empresa" />
            </FormField>

            <FormField label="Dominio" error={editForm.formState.errors.dominio?.message}>
              <Input {...editForm.register('dominio')} placeholder="https://www.empresa.com.br" />
            </FormField>

            <Controller
              name="plano"
              control={editForm.control}
              render={({ field }) => (
                <FormField label="Plano">
                  <Select value={field.value} onChange={field.onChange}>
                    <option value="basico">Basico</option>
                    <option value="profissional">Profissional</option>
                    <option value="enterprise">Enterprise</option>
                  </Select>
                </FormField>
              )}
            />
          </div>

          {/* R2 Storage */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-5">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Cloudflare R2</h3>
            <FormField label="Bucket name" error={editForm.formState.errors.r2_bucket_name?.message}>
              <Input {...editForm.register('r2_bucket_name')} placeholder="bucket-empresa" />
            </FormField>
            <FormField label="Public URL" error={editForm.formState.errors.r2_public_url?.message}>
              <Input {...editForm.register('r2_public_url')} placeholder="https://pub-xxx.r2.dev" />
            </FormField>
            <FormField label="Access Key ID" hint="Deixe em branco para manter a atual">
              <Input {...editForm.register('r2_access_key_id')} placeholder="••••••" />
            </FormField>
            <FormField label="Secret Access Key" hint="Deixe em branco para manter a atual">
              <Input type="password" {...editForm.register('r2_secret_access_key')} placeholder="••••••" />
            </FormField>
          </div>

          {/* Webhook */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-5">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Webhook</h3>
            <FormField label="Webhook de leads" error={editForm.formState.errors.webhook_leads?.message}>
              <Input {...editForm.register('webhook_leads')} placeholder="https://hooks.empresa.com/leads" />
            </FormField>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" loading={loading}>
              Salvar alteracoes
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/superadmin/empresas')}>
              Cancelar
            </Button>
          </div>
        </form>
      </PageWrapper>
    )
  }

  // Create form
  return (
    <PageWrapper
      title="Nova empresa"
      actions={
        <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/superadmin/empresas')}>
          Voltar
        </Button>
      }
    >
      <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="max-w-2xl space-y-6">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-5">
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Dados da empresa</h3>

          <FormField label="Nome" required error={createForm.formState.errors.nome?.message}>
            <Input {...createForm.register('nome')} placeholder="Nome da empresa" />
          </FormField>

          <Controller
            name="slug"
            control={createForm.control}
            render={({ field }) => (
              <SlugField
                value={field.value}
                onChange={field.onChange}
                baseValue={createForm.watch('nome')}
              />
            )}
          />

          <FormField label="Dominio" error={createForm.formState.errors.dominio?.message}>
            <Input {...createForm.register('dominio')} placeholder="https://www.empresa.com.br" />
          </FormField>

          <Controller
            name="plano"
            control={createForm.control}
            render={({ field }) => (
              <FormField label="Plano">
                <Select value={field.value} onChange={field.onChange}>
                  <option value="basico">Basico</option>
                  <option value="profissional">Profissional</option>
                  <option value="enterprise">Enterprise</option>
                </Select>
              </FormField>
            )}
          />
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-5">
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Admin inicial</h3>

          <FormField label="Nome do admin" required error={createForm.formState.errors.admin_nome?.message}>
            <Input {...createForm.register('admin_nome')} placeholder="Nome completo" />
          </FormField>

          <FormField label="E-mail do admin" required error={createForm.formState.errors.admin_email?.message}>
            <Input type="email" {...createForm.register('admin_email')} placeholder="admin@empresa.com" />
          </FormField>

          <FormField label="Senha do admin" required error={createForm.formState.errors.admin_senha?.message}>
            <Input type="password" {...createForm.register('admin_senha')} placeholder="Minimo 6 caracteres" />
          </FormField>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={loading}>
            Criar empresa
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/superadmin/empresas')}>
            Cancelar
          </Button>
        </div>
      </form>
    </PageWrapper>
  )
}
