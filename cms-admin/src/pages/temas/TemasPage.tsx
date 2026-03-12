import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { FormField } from '../../components/forms/FormField'
import { ColorPicker } from '../../components/forms/ColorPicker'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import temaService from '../../services/temaService'
import type { Tema } from '../../types'

const colorFields: { key: keyof Pick<Tema, 'cor_primaria' | 'cor_secundaria' | 'cor_destaque' | 'cor_texto' | 'cor_fundo' | 'cor_header' | 'cor_footer'>; label: string }[] = [
  { key: 'cor_primaria', label: 'Cor primaria' },
  { key: 'cor_secundaria', label: 'Cor secundaria' },
  { key: 'cor_destaque', label: 'Cor destaque' },
  { key: 'cor_texto', label: 'Cor do texto' },
  { key: 'cor_fundo', label: 'Cor de fundo' },
  { key: 'cor_header', label: 'Cor do header' },
  { key: 'cor_footer', label: 'Cor do footer' },
]

export default function TemasPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    cor_primaria: '#16A34A',
    cor_secundaria: '#0D0D0D',
    cor_destaque: '#F59E0B',
    cor_texto: '#F5F5F5',
    cor_fundo: '#0D0D0D',
    cor_header: '#0D0D0D',
    cor_footer: '#0D0D0D',
    fonte_principal: 'Inter',
    fonte_titulo: 'Inter',
  })

  useEffect(() => {
    const load = async () => {
      try {
        const data = await temaService.obter()
        setForm({
          cor_primaria: data.cor_primaria || '#16A34A',
          cor_secundaria: data.cor_secundaria || '#0D0D0D',
          cor_destaque: data.cor_destaque || '#F59E0B',
          cor_texto: data.cor_texto || '#F5F5F5',
          cor_fundo: data.cor_fundo || '#0D0D0D',
          cor_header: data.cor_header || '#0D0D0D',
          cor_footer: data.cor_footer || '#0D0D0D',
          fonte_principal: data.fonte_principal || 'Inter',
          fonte_titulo: data.fonte_titulo || 'Inter',
        })
      } catch {
        // First time - keep defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleColorChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await temaService.atualizar(form)
      toast.success('Tema atualizado com sucesso')
    } catch {
      toast.error('Erro ao atualizar tema')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageWrapper title="Tema">
        <div className="animate-pulse space-y-4 max-w-2xl">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-10 bg-[#1A1A1A] rounded-lg" />
          ))}
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Tema" subtitle="Identidade visual do site">
      <div className="max-w-2xl space-y-6">
        {/* Colors */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-5">
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Cores</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {colorFields.map((cf) => (
              <ColorPicker
                key={cf.key}
                label={cf.label}
                value={form[cf.key]}
                onChange={(v) => handleColorChange(cf.key, v)}
              />
            ))}
          </div>
        </div>

        {/* Fonts */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-5">
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Fontes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Fonte principal">
              <Input
                value={form.fonte_principal}
                onChange={(e) => setForm((prev) => ({ ...prev, fonte_principal: e.target.value }))}
                placeholder="Inter"
              />
            </FormField>
            <FormField label="Fonte dos titulos">
              <Input
                value={form.fonte_titulo}
                onChange={(e) => setForm((prev) => ({ ...prev, fonte_titulo: e.target.value }))}
                placeholder="Inter"
              />
            </FormField>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">Preview</h3>
          <div
            className="rounded-lg overflow-hidden border border-[#2A2A2A]"
            style={{ fontFamily: form.fonte_principal }}
          >
            {/* Header */}
            <div className="px-4 py-3" style={{ backgroundColor: form.cor_header }}>
              <span className="text-sm font-bold" style={{ color: form.cor_primaria, fontFamily: form.fonte_titulo }}>
                Logo da Empresa
              </span>
            </div>
            {/* Body */}
            <div className="px-4 py-6" style={{ backgroundColor: form.cor_fundo }}>
              <h2 className="text-lg font-bold mb-2" style={{ color: form.cor_texto, fontFamily: form.fonte_titulo }}>
                Titulo de exemplo
              </h2>
              <p className="text-sm mb-3" style={{ color: form.cor_texto }}>
                Texto de exemplo para visualizar as cores do tema.
              </p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded text-xs text-white" style={{ backgroundColor: form.cor_primaria }}>
                  Primaria
                </span>
                <span className="px-3 py-1 rounded text-xs text-white" style={{ backgroundColor: form.cor_secundaria }}>
                  Secundaria
                </span>
                <span className="px-3 py-1 rounded text-xs text-white" style={{ backgroundColor: form.cor_destaque }}>
                  Destaque
                </span>
              </div>
            </div>
            {/* Footer */}
            <div className="px-4 py-3" style={{ backgroundColor: form.cor_footer }}>
              <span className="text-xs" style={{ color: form.cor_texto }}>
                Footer da empresa
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} loading={saving}>
            Salvar tema
          </Button>
        </div>
      </div>
    </PageWrapper>
  )
}
