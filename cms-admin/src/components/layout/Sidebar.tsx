import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard,
  Image,
  FileText,
  Tag,
  Package,
  Star,
  Users,
  MessageSquare,
  HelpCircle,
  ImageIcon,
  Mail,
  Phone,
  FolderOpen,
  Settings,
  Palette,
  UsersRound,
  ToggleLeft,
  ChevronLeft,
  ChevronRight,
  Building2,
  X,
} from 'lucide-react'

interface MenuItem {
  label: string
  icon: React.ReactNode
  path: string
  modulo?: string
  superadminOnly?: boolean
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { label: 'Banners', icon: <Image size={20} />, path: '/banners', modulo: 'banners' },
  { label: 'Posts', icon: <FileText size={20} />, path: '/posts', modulo: 'posts' },
  { label: 'Categorias', icon: <Tag size={20} />, path: '/categorias', modulo: 'categorias' },
  { label: 'Itens', icon: <Package size={20} />, path: '/itens', modulo: 'itens' },
  { label: 'Destaques', icon: <Star size={20} />, path: '/destaques', modulo: 'destaques' },
  { label: 'Equipe', icon: <Users size={20} />, path: '/equipe', modulo: 'equipe' },
  { label: 'Depoimentos', icon: <MessageSquare size={20} />, path: '/depoimentos', modulo: 'depoimentos' },
  { label: 'FAQ', icon: <HelpCircle size={20} />, path: '/faq', modulo: 'faq' },
  { label: 'Galeria', icon: <ImageIcon size={20} />, path: '/galeria', modulo: 'galeria' },
  { label: 'Leads', icon: <Mail size={20} />, path: '/leads', modulo: 'leads' },
  { label: 'Contatos', icon: <Phone size={20} />, path: '/contatos', modulo: 'contatos' },
  { label: 'Arquivos', icon: <FolderOpen size={20} />, path: '/arquivos', modulo: 'arquivos' },
  { label: 'Configuracoes', icon: <Settings size={20} />, path: '/configuracoes', modulo: 'configuracoes' },
  { label: 'Temas', icon: <Palette size={20} />, path: '/temas', modulo: 'temas' },
  { label: 'Usuarios', icon: <UsersRound size={20} />, path: '/usuarios' },
  { label: 'Modulos', icon: <ToggleLeft size={20} />, path: '/modulos' },
  { label: 'Empresas', icon: <Building2 size={20} />, path: '/empresas', superadminOnly: true },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const usuario = useAuthStore((s) => s.usuario)

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    onMobileClose?.()
  }

  const filteredItems = menuItems.filter((item) => {
    if (item.superadminOnly && usuario?.role !== 'superadmin') return false
    return true
  })

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0D0D0D] border-r border-[#2A2A2A]">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#2A2A2A]">
        {!collapsed && (
          <span className="text-[#F5F5F5] font-bold text-lg tracking-tight">
            CMS<span className="text-green-500">Panel</span>
          </span>
        )}
        {collapsed && (
          <span className="text-green-500 font-bold text-lg mx-auto">C</span>
        )}
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="md:hidden p-1 text-[#9CA3AF] hover:text-[#F5F5F5] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {filteredItems.map((item) => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150 cursor-pointer
                ${active
                  ? 'text-green-500 bg-green-500/10'
                  : 'text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#1A1A1A]'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden md:block border-t border-[#2A2A2A] p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 text-[#9CA3AF] hover:text-[#F5F5F5] transition-colors rounded-lg hover:bg-[#1A1A1A]"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:block h-screen flex-shrink-0 transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-40"
            onClick={onMobileClose}
          />
          <aside className="md:hidden fixed inset-y-0 left-0 w-60 z-50">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
