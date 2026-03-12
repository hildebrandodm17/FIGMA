import { useState, useRef, useEffect, Fragment } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useEmpresa } from '../../hooks/useEmpresa'
import { ChevronRight, LogOut, Menu } from 'lucide-react'

const pathLabels: Record<string, string> = {
  '': 'Dashboard',
  banners: 'Banners',
  posts: 'Posts',
  categorias: 'Categorias',
  itens: 'Itens',
  destaques: 'Destaques',
  equipe: 'Equipe',
  depoimentos: 'Depoimentos',
  faq: 'FAQ',
  galeria: 'Galeria',
  leads: 'Leads',
  contatos: 'Contatos',
  arquivos: 'Arquivos',
  configuracoes: 'Configuracoes',
  temas: 'Temas',
  usuarios: 'Usuarios',
  modulos: 'Modulos',
  empresas: 'Empresas',
  novo: 'Novo',
  login: 'Login',
}

interface HeaderProps {
  onMobileMenuToggle?: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const { usuario, logout } = useAuth()
  const { empresaAtiva, impersonado } = useEmpresa()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Build breadcrumb
  const segments = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((seg) => pathLabels[seg] || seg)
  if (segments.length === 0) breadcrumbs.push('Dashboard')

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
  }

  return (
    <>
      {/* Impersonation banner */}
      {impersonado && (
        <div className="bg-red-600 text-white text-center text-sm py-1.5 px-4 font-medium">
          Voce esta acessando como: {empresaAtiva?.nome}
        </div>
      )}

      <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-[#0D0D0D] border-b border-[#2A2A2A] flex-shrink-0">
        {/* Left: hamburger + breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 text-[#9CA3AF] hover:text-[#F5F5F5] transition-colors"
          >
            <Menu size={20} />
          </button>

          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <Fragment key={i}>
                {i > 0 && <ChevronRight size={14} className="text-[#9CA3AF]" />}
                <span
                  className={
                    i === breadcrumbs.length - 1
                      ? 'text-[#F5F5F5] font-medium'
                      : 'text-[#9CA3AF]'
                  }
                >
                  {crumb}
                </span>
              </Fragment>
            ))}
          </nav>
        </div>

        {/* Right: empresa + user dropdown */}
        <div className="flex items-center gap-4">
          {empresaAtiva && (
            <span className="hidden sm:block text-sm text-[#9CA3AF]">
              {empresaAtiva.nome}
            </span>
          )}

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#1A1A1A] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-500 text-sm font-semibold">
                  {usuario?.nome?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="hidden sm:block text-sm text-[#F5F5F5] max-w-[120px] truncate">
                {usuario?.nome}
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-xl z-50 py-1">
                <div className="px-4 py-3 border-b border-[#2A2A2A]">
                  <p className="text-sm font-medium text-[#F5F5F5] truncate">
                    {usuario?.nome}
                  </p>
                  <p className="text-xs text-[#9CA3AF] truncate mt-0.5">
                    {usuario?.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-[#2A2A2A] transition-colors"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
