import { useState, useEffect } from 'react'
import type { Categoria } from '../../types'
import categoriaService from '../../services/categoriaService'

interface SelectCategoriaProps {
  tipo: 'post' | 'item'
  value?: string
  onChange: (id: string) => void
}

export function SelectCategoria({ tipo, value, onChange }: SelectCategoriaProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchCategorias = async () => {
      setLoading(true)
      try {
        const response = await categoriaService.listar({ tipo, limite: 100 })
        if (!cancelled) {
          setCategorias(response.data)
        }
      } catch {
        if (!cancelled) {
          setCategorias([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchCategorias()
    return () => { cancelled = true }
  }, [tipo])

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      className="w-full px-3 py-2 text-sm text-[#F5F5F5] bg-[#141414] border border-[#2A2A2A] rounded-lg focus:outline-none focus:border-green-500 transition-colors appearance-none disabled:opacity-50"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 0.5rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1.5em 1.5em',
        paddingRight: '2.5rem',
      }}
    >
      <option value="">
        {loading ? 'Carregando...' : 'Selecione uma categoria'}
      </option>
      {categorias.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.nome}
        </option>
      ))}
    </select>
  )
}
