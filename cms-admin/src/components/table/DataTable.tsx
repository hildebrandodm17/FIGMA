import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  emptyMessage = 'Nenhum item encontrado',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (aVal == null) return 1
    if (bVal == null) return -1
    if (typeof aVal === 'string') {
      return sortDir === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal
  })

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2A2A2A]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-[#2A2A2A] last:border-b-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-[#2A2A2A] rounded animate-pulse w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2A2A2A]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="flex flex-col items-center justify-center py-16 text-[#9CA3AF]">
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#2A2A2A]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider"
              >
                {col.sortable ? (
                  <button
                    onClick={() => handleSort(col.key)}
                    className="flex items-center gap-1 hover:text-[#F5F5F5] transition-colors"
                  >
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === 'asc' ? (
                        <ArrowUp size={14} />
                      ) : (
                        <ArrowDown size={14} />
                      )
                    ) : (
                      <ArrowUpDown size={14} className="opacity-40" />
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, rowIndex) => (
            <tr
              key={item.id || rowIndex}
              className="border-b border-[#2A2A2A] last:border-b-0 hover:bg-[#0D0D0D]/50 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-[#F5F5F5]">
                  {col.render ? col.render(item) : item[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
