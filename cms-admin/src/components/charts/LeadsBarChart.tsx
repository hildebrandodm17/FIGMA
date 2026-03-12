import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface LeadsBarChartProps {
  data: { mes: string; total: number }[]
}

export function LeadsBarChart({ data }: LeadsBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
        <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">Leads por mes</h3>
        <div className="flex items-center justify-center h-64 text-sm text-[#9CA3AF]">
          Nenhum dado disponivel
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
      <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">Leads por mes</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#2A2A2A"
            vertical={false}
          />
          <XAxis
            dataKey="mes"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #2A2A2A',
              borderRadius: '8px',
              color: '#F5F5F5',
              fontSize: '13px',
            }}
            cursor={{ fill: 'rgba(22, 163, 74, 0.05)' }}
            labelStyle={{ color: '#9CA3AF' }}
          />
          <Bar
            dataKey="total"
            fill="#16A34A"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
