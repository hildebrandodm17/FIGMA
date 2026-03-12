import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Users, CheckCircle, Clock, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { DataTable, type Column } from '../../components/table/DataTable'
import { Pagination } from '../../components/table/Pagination'
import { TableActions } from '../../components/table/TableActions'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { StatsCard } from '../../components/charts/StatsCard'
import { LeadsBarChart } from '../../components/charts/LeadsBarChart'
import { usePermissaoModulo } from '../../hooks/usePermissao'
import leadService from '../../services/leadService'
import { formatDate } from '../../utils/formatDate'
import type { Lead, PaginationMeta, LeadGrafico } from '../../types'

type Filtro = 'todos' | 'pendentes' | 'respondidos'

export default function LeadList() {
  const navigate = useNavigate()
  const { podeExportar, podeDeletar } = usePermissaoModulo('leads')

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, pagina: 1, limite: 20, paginas: 1 })
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Stats
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, ativos: 0, respondidos: 0, ultimos30: 0 })
  const [graficoData, setGraficoData] = useState<LeadGrafico[]>([])

  const fetchLeads = useCallback(async (pagina = 1, limite = 20, status?: string) => {
    setLoading(true)
    try {
      const params: Record<string, any> = { pagina, limite }
      if (status && status !== 'todos') params.status = status
      const res = await leadService.listar(params)
      setLeads(res.data)
      setMeta(res.meta)
    } catch {
      toast.error('Erro ao carregar leads')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const [allRes, respondidosRes, grafico] = await Promise.all([
        leadService.listar({ limite: 1 }),
        leadService.listar({ limite: 1, status: 'respondidos' }),
        leadService.grafico(),
      ])
      const total = allRes.meta.total
      const respondidos = respondidosRes.meta.total
      const ativos = total - respondidos
      // Calculate last 30 days from graph data
      const ultimos30 = grafico.length > 0 ? grafico[grafico.length - 1]?.total ?? 0 : 0
      setStats({ total, ativos, respondidos, ultimos30 })
      setGraficoData(grafico)
    } catch {
      // Stats are secondary, don't block the page
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads(1, 20, filtro)
    fetchStats()
  }, [fetchLeads, fetchStats, filtro])

  const handleFilterChange = (f: Filtro) => {
    setFiltro(f)
    fetchLeads(1, meta.limite, f)
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const blob = await leadService.exportarCSV()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('CSV exportado com sucesso')
    } catch {
      toast.error('Erro ao exportar CSV')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await leadService.deletar(deleteId)
      toast.success('Lead deletado com sucesso')
      setDeleteId(null)
      fetchLeads(meta.pagina, meta.limite, filtro)
      fetchStats()
    } catch {
      toast.error('Erro ao deletar lead')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Lead>[] = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'respondido',
      label: 'Status',
      render: (item) => (
        <Badge variant={item.respondido ? 'active' : 'draft'}>
          {item.respondido ? 'Respondido' : 'Pendente'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Data',
      sortable: true,
      render: (item) => <span>{formatDate(item.created_at)}</span>,
    },
    {
      key: 'acoes',
      label: 'Acoes',
      render: (item) => (
        <TableActions
          onView={() => navigate(`/leads/${item.id}`)}
          onDelete={podeDeletar ? () => setDeleteId(item.id) : undefined}
        />
      ),
    },
  ]

  const filtros: { key: Filtro; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'pendentes', label: 'Pendentes' },
    { key: 'respondidos', label: 'Respondidos' },
  ]

  return (
    <PageWrapper
      title="Leads"
      subtitle="Central de leads"
      actions={
        podeExportar ? (
          <Button
            variant="secondary"
            icon={<Download size={16} />}
            onClick={handleExportCSV}
            loading={exporting}
          >
            Exportar CSV
          </Button>
        ) : undefined
      }
    >
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Leads Ativos" value={stats.ativos} icon={<Users size={20} />} loading={statsLoading} />
        <StatsCard title="Respondidos" value={stats.respondidos} icon={<CheckCircle size={20} />} loading={statsLoading} />
        <StatsCard title="Ultimos 30 dias" value={stats.ultimos30} icon={<Clock size={20} />} loading={statsLoading} />
        <StatsCard title="Total" value={stats.total} icon={<BarChart3 size={20} />} loading={statsLoading} />
      </div>

      {/* Chart */}
      <LeadsBarChart data={graficoData} />

      {/* Filter buttons */}
      <div className="flex items-center gap-2">
        {filtros.map((f) => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtro === f.key
                ? 'bg-green-500/20 text-green-500'
                : 'text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#1A1A1A]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable columns={columns} data={leads} loading={loading} emptyMessage="Nenhum lead encontrado" />
      <Pagination meta={meta} onPageChange={(p) => fetchLeads(p, meta.limite, filtro)} onLimiteChange={(l) => fetchLeads(1, l, filtro)} />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Deletar lead"
        message="Esta acao nao pode ser desfeita. Deseja continuar?"
        confirmLabel={deleting ? 'Deletando...' : 'Deletar'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </PageWrapper>
  )
}
