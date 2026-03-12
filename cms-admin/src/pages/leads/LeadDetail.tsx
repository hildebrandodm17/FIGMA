import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Mail, Phone, Globe, MapPin, Calendar, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import leadService from '../../services/leadService'
import { formatDateTime } from '../../utils/formatDate'
import type { Lead } from '../../types'

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const data = await leadService.obter(id)
        setLead(data)
      } catch {
        toast.error('Erro ao carregar lead')
        navigate('/leads')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  const handleMarcarRespondido = async () => {
    if (!id) return
    setMarking(true)
    try {
      const updated = await leadService.marcarRespondido(id)
      setLead(updated)
      toast.success('Lead marcado como respondido')
    } catch {
      toast.error('Erro ao marcar como respondido')
    } finally {
      setMarking(false)
    }
  }

  if (loading) {
    return (
      <PageWrapper title="Carregando...">
        <div className="animate-pulse space-y-4 max-w-2xl">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-6 bg-[#1A1A1A] rounded w-3/4" />
          ))}
        </div>
      </PageWrapper>
    )
  }

  if (!lead) return null

  const fields = [
    { icon: <Mail size={16} />, label: 'E-mail', value: lead.email },
    { icon: <Phone size={16} />, label: 'Telefone', value: lead.telefone || '--' },
    { icon: <Globe size={16} />, label: 'Origem', value: lead.origem || '--' },
    { icon: <MapPin size={16} />, label: 'IP de origem', value: lead.ip_origem || '--' },
    { icon: <Calendar size={16} />, label: 'Data de envio', value: formatDateTime(lead.created_at) },
    { icon: <Shield size={16} />, label: 'LGPD aceito', value: lead.lgpd_aceito ? 'Sim' : 'Nao' },
  ]

  return (
    <PageWrapper
      title={lead.nome}
      subtitle="Detalhes do lead"
      actions={
        <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/leads')}>
          Voltar
        </Button>
      }
    >
      <div className="max-w-2xl space-y-6">
        {/* Status */}
        <div className="flex items-center gap-3">
          <Badge variant={lead.respondido ? 'active' : 'draft'}>
            {lead.respondido ? 'Respondido' : 'Pendente'}
          </Badge>
          {lead.respondido && lead.respondido_em && (
            <span className="text-xs text-[#9CA3AF]">
              Respondido em {formatDateTime(lead.respondido_em)}
            </span>
          )}
        </div>

        {/* Info card */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-4">
          {fields.map((f) => (
            <div key={f.label} className="flex items-start gap-3">
              <span className="text-[#9CA3AF] mt-0.5 shrink-0">{f.icon}</span>
              <div>
                <p className="text-xs text-[#9CA3AF] font-medium">{f.label}</p>
                <p className="text-sm text-[#F5F5F5] mt-0.5">{f.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mensagem */}
        {lead.mensagem && (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
            <p className="text-xs text-[#9CA3AF] font-medium mb-2">Mensagem</p>
            <p className="text-sm text-[#F5F5F5] whitespace-pre-wrap">{lead.mensagem}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {!lead.respondido && (
            <Button
              icon={<CheckCircle size={16} />}
              onClick={handleMarcarRespondido}
              loading={marking}
            >
              Marcar como respondido
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/leads')}>
            Voltar para lista
          </Button>
        </div>
      </div>
    </PageWrapper>
  )
}
