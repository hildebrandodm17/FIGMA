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
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import usuarioService from '../../services/usuarioService'

const MODULOS = [
  'banners', 'posts', 'categorias', 'itens', 'destaques',
  'equipe', 'depoimentos', 'faq', 'galeria', 'leads',
  'contatos', 'arquivos', 'configuracoes', 'temas',
]

const ACOES = ['ver', 'criar', 'editar', 'deletar', 'exportar'] as const

const schema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  email: z.string().email('E-mail invalido'),
  senha: z.string().optional(),
  role: z.enum(['admin', 'usuario']),
})

type FormData = z.infer<typeof schema>

interface PermissaoMap {
  [modulo: string]: string[]
}

export default function UsuarioForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(isEdit)
  const [permissoes, setPermissoes] = useState<PermissaoMap>({})

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(
      isEdit
        ? schema
        : schema.extend({ senha: z.string().min(6, 'Senha deve ter no minimo 6 caracteres') })
    ),
    defaultValues: { nome: '', email: '', senha: '', role: 'usuario' },
  })

  const role = watch('role')

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        const user = await usuarioService.obter(id)
        reset({
          nome: user.nome,
          email: user.email,
          senha: '',
          role: user.role as 'admin' | 'usuario',
        })
        // Build permissions map from user permissions
        const permMap: PermissaoMap = {}
        if (Array.isArray(user.permissoes)) {
          user.permissoes.forEach((p) => {
            const acoes: string[] = []
            if (p.pode_ver) acoes.push('ver')
            if (p.pode_criar) acoes.push('criar')
            if (p.pode_editar) acoes.push('editar')
            if (p.pode_deletar) acoes.push('deletar')
            if (p.pode_exportar) acoes.push('exportar')
            permMap[p.modulo] = acoes
          })
        }
        setPermissoes(permMap)
      } catch {
        toast.error('Erro ao carregar usuario')
        navigate('/usuarios')
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [id, isEdit, navigate, reset])

  const togglePermissao = (modulo: string, acao: string) => {
    setPermissoes((prev) => {
      const current = prev[modulo] || []
      const next = current.includes(acao)
        ? current.filter((a) => a !== acao)
        : [...current, acao]
      return { ...prev, [modulo]: next }
    })
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      // Build permissoes array
      const permissoesArray = role === 'usuario'
        ? MODULOS.map((modulo) => {
            const acoes = permissoes[modulo] || []
            return {
              modulo,
              pode_ver: acoes.includes('ver'),
              pode_criar: acoes.includes('criar'),
              pode_editar: acoes.includes('editar'),
              pode_deletar: acoes.includes('deletar'),
              pode_exportar: acoes.includes('exportar'),
            }
          }).filter((p) => p.pode_ver || p.pode_criar || p.pode_editar || p.pode_deletar || p.pode_exportar)
        : []

      const payload: any = {
        nome: data.nome,
        email: data.email,
        role: data.role,
        permissoes: permissoesArray,
      }

      if (data.senha) {
        payload.senha = data.senha
      }

      if (isEdit) {
        await usuarioService.atualizar(id, payload)
        toast.success('Usuario atualizado com sucesso')
      } else {
        await usuarioService.criar(payload)
        toast.success('Usuario criado com sucesso')
      }
      navigate('/usuarios')
    } catch {
      toast.error(isEdit ? 'Erro ao atualizar usuario' : 'Erro ao criar usuario')
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
      title={isEdit ? 'Editar usuario' : 'Novo usuario'}
      actions={
        <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/usuarios')}>
          Voltar
        </Button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
        {/* Basic fields */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-5">
          <FormField label="Nome" required error={errors.nome?.message}>
            <Input {...register('nome')} placeholder="Nome completo" />
          </FormField>

          <FormField label="E-mail" required error={errors.email?.message}>
            <Input type="email" {...register('email')} placeholder="email@exemplo.com" />
          </FormField>

          <FormField
            label="Senha"
            required={!isEdit}
            error={errors.senha?.message}
            hint={isEdit ? 'Deixe em branco para manter a senha atual' : undefined}
          >
            <Input type="password" {...register('senha')} placeholder={isEdit ? '••••••' : 'Minimo 6 caracteres'} />
          </FormField>

          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <FormField label="Papel">
                <Select value={field.value} onChange={field.onChange}>
                  <option value="admin">Admin</option>
                  <option value="usuario">Usuario</option>
                </Select>
              </FormField>
            )}
          />
        </div>

        {/* Permissions matrix - only for role=usuario */}
        {role === 'usuario' && (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">Permissoes por modulo</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A2A2A]">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-[#9CA3AF] uppercase">Modulo</th>
                    {ACOES.map((acao) => (
                      <th key={acao} className="px-3 py-2 text-xs font-semibold text-[#9CA3AF] uppercase text-center">
                        {acao}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULOS.map((modulo) => (
                    <tr key={modulo} className="border-b border-[#2A2A2A] last:border-b-0 hover:bg-[#0D0D0D]/50">
                      <td className="px-3 py-2 text-sm text-[#F5F5F5] capitalize">{modulo}</td>
                      {ACOES.map((acao) => {
                        const checked = (permissoes[modulo] || []).includes(acao)
                        return (
                          <td key={acao} className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermissao(modulo, acao)}
                              className="h-4 w-4 rounded border-[#2A2A2A] bg-[#141414] text-green-600 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={loading}>
            {isEdit ? 'Salvar alteracoes' : 'Criar usuario'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/usuarios')}>
            Cancelar
          </Button>
        </div>
      </form>
    </PageWrapper>
  )
}
