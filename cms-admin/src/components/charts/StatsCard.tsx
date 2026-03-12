import { TrendingUp, TrendingDown } from 'lucide-react'
import type { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: number | string
  icon?: ReactNode
  loading?: boolean
  trend?: 'up' | 'down'
}

export function StatsCard({ title, value, icon, loading, trend }: StatsCardProps) {
  if (loading) {
    return (
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-3 w-20 bg-[#2A2A2A] rounded animate-pulse" />
            <div className="h-8 w-16 bg-[#2A2A2A] rounded animate-pulse" />
          </div>
          <div className="w-10 h-10 bg-[#2A2A2A] rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#9CA3AF] font-medium">{title}</p>
          <div className="flex items-end gap-2 mt-2">
            <p className="text-3xl font-bold text-[#F5F5F5]">{value}</p>
            {trend && (
              <span
                className={`flex items-center gap-0.5 text-xs font-medium mb-1 ${
                  trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
