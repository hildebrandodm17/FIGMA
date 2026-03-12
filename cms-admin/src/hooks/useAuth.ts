import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import authService from '../services/authService'

export function useAuth() {
  const { usuario, isAuthenticated, accessToken } = useAuthStore()
  const navigate = useNavigate()

  const login = useCallback(async (email: string, senha: string) => {
    await authService.login(email, senha)
    navigate('/')
  }, [navigate])

  const logout = useCallback(async () => {
    await authService.logout()
    navigate('/login')
  }, [navigate])

  return {
    usuario,
    isAuthenticated,
    accessToken,
    login,
    logout,
    isSuperAdmin: usuario?.role === 'superadmin',
    isAdmin: usuario?.role === 'admin' || usuario?.role === 'superadmin',
  }
}
