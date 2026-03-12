import { useEffect, useState } from 'react'
import {
  Mail,
  MailCheck,
  CalendarDays,
  Inbox,
  FileText,
  Package,
} from 'lucide-react'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { StatsCard } from '../../components/charts/StatsCard'
import { LeadsBarChart } from '../../components/charts/LeadsBarChart'
import { Skeleton } from '../../components/ui/Skeleton'
import api from '../../services/api'

interface DashboardData {
  leads: {
    ativos: number
    respondidos: number
    ultimos_30_dias: number
    total: number
  }
  leads_por_mes: { mes: string; total: number }[]
  posts: {
    total: number
    publicados: number
    rascunhos: number
  }
  itens: {
    total: number
    ativos: number
  }
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/admin/dashboard')
        setData(response.data)
      } catch {
        // silently fail — cards will show 0
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  return (
    <PageWrapper title="Painel">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Leads Ativos"
          value={data?.leads.ativos ?? 0}
          icon={<Mail size={20} />}
          loading={loading}
        />
        <StatsCard
          title="Leads Respondidos"
          value={data?.leads.respondidos ?? 0}
          icon={<MailCheck size={20} />}
          loading={loading}
        />
        <StatsCard
          title="Últimos 30 dias"
          value={data?.leads.ultimos_30_dias ?? 0}
          icon={<CalendarDays size={20} />}
          loading={loading}
        />
        <StatsCard
          title="Total Recebidos"
          value={data?.leads.total ?? 0}
          icon={<Inbox size={20} />}
          loading={loading}
        />
      </div>

      {/* Leads Chart */}
      {loading ? (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <LeadsBarChart data={data?.leads_por_mes ?? []} />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Posts Summary */}
        {loading ? (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={18} className="text-green-500" />
              <h3 className="text-sm font-semibold text-[#F5F5F5]">Posts</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9CA3AF]">Total</span>
                <span className="text-sm font-medium text-[#F5F5F5]">
                  {data?.posts.total ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9CA3AF]">Publicados</span>
                <span className="text-sm font-medium text-green-500">
                  {data?.posts.publicados ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9CA3AF]">Rascunhos</span>
                <span className="text-sm font-medium text-yellow-500">
                  {data?.posts.rascunhos ?? 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Itens Summary */}
        {loading ? (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package size={18} className="text-green-500" />
              <h3 className="text-sm font-semibold text-[#F5F5F5]">Itens</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9CA3AF]">Total</span>
                <span className="text-sm font-medium text-[#F5F5F5]">
                  {data?.itens.total ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9CA3AF]">Ativos</span>
                <span className="text-sm font-medium text-green-500">
                  {data?.itens.ativos ?? 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
