import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PaginationMeta } from '../../types'

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  onLimiteChange?: (limite: number) => void
}

export function Pagination({ meta, onPageChange, onLimiteChange }: PaginationProps) {
  const { total, pagina, limite, paginas } = meta

  const start = Math.min((pagina - 1) * limite + 1, total)
  const end = Math.min(pagina * limite, total)

  // Generate page numbers to display
  const getPageNumbers = (): (number | '...')[] => {
    if (paginas <= 7) {
      return Array.from({ length: paginas }, (_, i) => i + 1)
    }

    const pages: (number | '...')[] = [1]

    if (pagina > 3) pages.push('...')

    const rangeStart = Math.max(2, pagina - 1)
    const rangeEnd = Math.min(paginas - 1, pagina + 1)

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i)
    }

    if (pagina < paginas - 2) pages.push('...')

    pages.push(paginas)

    return pages
  }

  if (total === 0) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3">
      {/* Info + items per page */}
      <div className="flex items-center gap-4 text-sm text-[#9CA3AF]">
        <span>
          {start}-{end} de {total} itens
        </span>
        {onLimiteChange && (
          <select
            value={limite}
            onChange={(e) => onLimiteChange(Number(e.target.value))}
            className="px-2 py-1 text-sm text-[#F5F5F5] bg-[#141414] border border-[#2A2A2A] rounded-md focus:outline-none focus:border-green-500"
          >
            <option value={10}>10 / pag</option>
            <option value={20}>20 / pag</option>
            <option value={50}>50 / pag</option>
          </select>
        )}
      </div>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(pagina - 1)}
          disabled={pagina <= 1}
          className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((page, i) =>
          page === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-[#9CA3AF] text-sm">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`
                min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors
                ${page === pagina
                  ? 'bg-green-500/20 text-green-500'
                  : 'text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#1A1A1A]'
                }
              `}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(pagina + 1)}
          disabled={pagina >= paginas}
          className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
