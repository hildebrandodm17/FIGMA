import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layout
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'

// Pages
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import BannerList from './pages/banners/BannerList'
import BannerForm from './pages/banners/BannerForm'
import PostList from './pages/posts/PostList'
import PostForm from './pages/posts/PostForm'
import CategoriaList from './pages/categorias/CategoriaList'
import CategoriaForm from './pages/categorias/CategoriaForm'
import ItemList from './pages/itens/ItemList'
import ItemForm from './pages/itens/ItemForm'
import DestaqueList from './pages/destaques/DestaqueList'
import DestaqueForm from './pages/destaques/DestaqueForm'
import EquipeList from './pages/equipe/EquipeList'
import EquipeForm from './pages/equipe/EquipeForm'
import DepoimentoList from './pages/depoimentos/DepoimentoList'
import DepoimentoForm from './pages/depoimentos/DepoimentoForm'
import FaqList from './pages/faq/FaqList'
import FaqForm from './pages/faq/FaqForm'
import GaleriaPage from './pages/galeria/GaleriaPage'
import LeadList from './pages/leads/LeadList'
import LeadDetail from './pages/leads/LeadDetail'
import ContatosForm from './pages/contatos/ContatosForm'
import ArquivosPage from './pages/arquivos/ArquivosPage'
import ConfiguracoesPage from './pages/configuracoes/ConfiguracoesPage'
import TemasPage from './pages/temas/TemasPage'
import UsuarioList from './pages/usuarios/UsuarioList'
import UsuarioForm from './pages/usuarios/UsuarioForm'
import ModulosPage from './pages/modulos/ModulosPage'
import EmpresaList from './pages/superadmin/EmpresaList'
import EmpresaForm from './pages/superadmin/EmpresaForm'

function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <AppLayout />
}

function GuestGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/" replace />
  return <Outlet />
}

function AppLayout() {
  return (
    <div className="flex h-screen bg-cms-bg overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    element: <GuestGuard />,
    children: [
      { path: '/login', element: <Login /> },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/banners', element: <BannerList /> },
      { path: '/banners/novo', element: <BannerForm /> },
      { path: '/banners/:id', element: <BannerForm /> },
      { path: '/posts', element: <PostList /> },
      { path: '/posts/novo', element: <PostForm /> },
      { path: '/posts/:id', element: <PostForm /> },
      { path: '/categorias', element: <CategoriaList /> },
      { path: '/categorias/novo', element: <CategoriaForm /> },
      { path: '/categorias/:id', element: <CategoriaForm /> },
      { path: '/itens', element: <ItemList /> },
      { path: '/itens/novo', element: <ItemForm /> },
      { path: '/itens/:id', element: <ItemForm /> },
      { path: '/destaques', element: <DestaqueList /> },
      { path: '/destaques/novo', element: <DestaqueForm /> },
      { path: '/destaques/:id', element: <DestaqueForm /> },
      { path: '/equipe', element: <EquipeList /> },
      { path: '/equipe/novo', element: <EquipeForm /> },
      { path: '/equipe/:id', element: <EquipeForm /> },
      { path: '/depoimentos', element: <DepoimentoList /> },
      { path: '/depoimentos/novo', element: <DepoimentoForm /> },
      { path: '/depoimentos/:id', element: <DepoimentoForm /> },
      { path: '/faq', element: <FaqList /> },
      { path: '/faq/novo', element: <FaqForm /> },
      { path: '/faq/:id', element: <FaqForm /> },
      { path: '/galeria', element: <GaleriaPage /> },
      { path: '/leads', element: <LeadList /> },
      { path: '/leads/:id', element: <LeadDetail /> },
      { path: '/contatos', element: <ContatosForm /> },
      { path: '/arquivos', element: <ArquivosPage /> },
      { path: '/configuracoes', element: <ConfiguracoesPage /> },
      { path: '/temas', element: <TemasPage /> },
      { path: '/usuarios', element: <UsuarioList /> },
      { path: '/usuarios/novo', element: <UsuarioForm /> },
      { path: '/usuarios/:id', element: <UsuarioForm /> },
      { path: '/modulos', element: <ModulosPage /> },
      // SuperAdmin
      { path: '/empresas', element: <EmpresaList /> },
      { path: '/empresas/novo', element: <EmpresaForm /> },
      { path: '/empresas/:id', element: <EmpresaForm /> },
    ],
  },
])
