import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { FormField } from '../../components/forms/FormField'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import configuracaoService from '../../services/configuracaoService'
import type { ConfiguracaoSecao } from '../../types'

const novaChaveSchema = z.object({
  chave: z.string().min(1, 'Chave e obrigatoria'),
  valor: z.string().min(1, 'Valor e obrigatorio'),
  tipo: z.string().min(1, 'Tipo e obrigatorio'),
})

type NovaChaveForm = z.infer<typeof novaChaveSchema>

export default function ConfiguracoesPage() {
  const [secoes, setSecoes] = useState<ConfiguracaoSecao[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('')
  const [valores, setValores] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [addingKey, setAddingKey] = useState(false)

  const {
    register,
    handleSubmit: handleNovaChave,
    reset: resetNovaChave,
    formState: { errors: novaChaveErrors },
  } = useForm<NovaChaveForm>({
    resolver: zodResolver(novaChaveSchema),
    defaultValues: { chave: '', valor: '', tipo: 'texto' },
  })

  const fetchSecoes = useCallback(async () => {
    setLoading(true)
    try {
      const data = await configuracaoService.listarSecoes()
      setSecoes(data)
      if (data.length > 0 && !activeTab) {
        setActiveTab(data[0].secao)
        setValores(data[0].valores)
      }
    } catch {
      toast.error('Erro ao carregar configuracoes')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchSecoes()
  }, [fetchSecoes])

  const handleTabChange = (secao: string) => {
    setActiveTab(secao)
    const found = secoes.find((s) => s.secao === secao)
    setValores(found?.valores || {})
  }

  const handleValueChange = (key: string, value: string) => {
    setValores((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!activeTab) return
    setSaving(true)
    try {
      const updated = await configuracaoService.atualizarSecao(activeTab, valores)
      setValores(updated.valores)
      // Update local state
      setSecoes((prev) => prev.map((s) => (s.secao === activeTab ? updated : s)))
      toast.success('Configuracoes atualizadas com sucesso')
    } catch {
      toast.error('Erro ao atualizar configuracoes')
    } finally {
      setSaving(false)
    }
  }

  const onAddKey = async (data: NovaChaveForm) => {
    if (!activeTab) return
    setAddingKey(true)
    try {
      await configuracaoService.adicionarChave(activeTab, data)
      toast.success('Configuracao adicionada com sucesso')
      resetNovaChave()
      fetchSecoes()
    } catch {
      toast.error('Erro ao adicionar configuracao')
    } finally {
      setAddingKey(false)
    }
  }

  if (loading) {
    return (
      <PageWrapper title="Configuracoes">
        <div className="animate-pulse space-y-4 max-w-3xl">
          <div className="h-10 bg-[#1A1A1A] rounded-lg w-1/2" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-[#1A1A1A] rounded-lg" />
          ))}
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Configuracoes" subtitle="Textos e configuracoes das paginas">
      <div className="max-w-3xl space-y-6">
        {/* Tabs */}
        {secoes.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto border-b border-[#2A2A2A] pb-px">
            {secoes.map((s) => (
              <button
                key={s.secao}
                onClick={() => handleTabChange(s.secao)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === s.secao
                    ? 'border-green-500 text-green-500'
                    : 'border-transparent text-[#9CA3AF] hover:text-[#F5F5F5]'
                }`}
              >
                {s.secao}
              </button>
            ))}
          </div>
        )}

        {/* Key-value fields */}
        {activeTab && (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-5">
            {Object.keys(valores).length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">Nenhuma configuracao nesta secao</p>
            ) : (
              Object.entries(valores).map(([key, val]) => (
                <FormField key={key} label={key}>
                  {val.length > 100 ? (
                    <Textarea
                      value={val}
                      onChange={(e) => handleValueChange(key, e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <Input
                      value={val}
                      onChange={(e) => handleValueChange(key, e.target.value)}
                    />
                  )}
                </FormField>
              ))
            )}

            <div className="pt-4 border-t border-[#2A2A2A]">
              <Button icon={<Save size={16} />} onClick={handleSave} loading={saving}>
                Atualizar dados
              </Button>
            </div>
          </div>
        )}

        {/* Add new key */}
        {activeTab && (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">Inserir nova configuracao</h3>
            <form onSubmit={handleNovaChave(onAddKey)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Chave" required error={novaChaveErrors.chave?.message}>
                  <Input {...register('chave')} placeholder="titulo_hero" />
                </FormField>
                <FormField label="Valor" required error={novaChaveErrors.valor?.message}>
                  <Input {...register('valor')} placeholder="Bem-vindo ao nosso site" />
                </FormField>
                <FormField label="Tipo" required error={novaChaveErrors.tipo?.message}>
                  <Select {...register('tipo')}>
                    <option value="texto">Texto</option>
                    <option value="textarea">Texto longo</option>
                    <option value="url">URL</option>
                    <option value="numero">Numero</option>
                  </Select>
                </FormField>
              </div>
              <Button type="submit" variant="secondary" icon={<Plus size={16} />} loading={addingKey}>
                Adicionar
              </Button>
            </form>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
