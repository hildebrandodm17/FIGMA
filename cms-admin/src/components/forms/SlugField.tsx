import { useState, useEffect } from 'react'
import { Link2, Link2Off } from 'lucide-react'
import { generateSlug } from '../../utils/generateSlug'

interface SlugFieldProps {
  value: string
  onChange: (slug: string) => void
  baseValue: string
  prefix?: string
}

export function SlugField({ value, onChange, baseValue, prefix }: SlugFieldProps) {
  const [linked, setLinked] = useState(true)

  // Auto-generate slug from baseValue when linked
  useEffect(() => {
    if (linked && baseValue) {
      onChange(generateSlug(baseValue))
    }
  }, [baseValue, linked, onChange])

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-[#F5F5F5]">Slug</label>
        <button
          type="button"
          onClick={() => setLinked(!linked)}
          title={linked ? 'Desvincular do titulo' : 'Vincular ao titulo'}
          className={`p-1 rounded transition-colors ${
            linked
              ? 'text-green-500 hover:text-green-400'
              : 'text-[#9CA3AF] hover:text-[#F5F5F5]'
          }`}
        >
          {linked ? <Link2 size={14} /> : <Link2Off size={14} />}
        </button>
      </div>

      <div className="flex">
        {prefix && (
          <span className="inline-flex items-center px-3 text-xs text-[#9CA3AF] bg-[#0D0D0D] border border-r-0 border-[#2A2A2A] rounded-l-lg">
            {prefix}
          </span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (!linked) {
              onChange(generateSlug(e.target.value))
            }
          }}
          readOnly={linked}
          className={`
            flex-1 px-3 py-2 text-sm text-[#F5F5F5] bg-[#141414] border border-[#2A2A2A]
            focus:outline-none focus:border-green-500 transition-colors
            ${prefix ? 'rounded-r-lg' : 'rounded-lg'}
            ${linked ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        />
      </div>
    </div>
  )
}
