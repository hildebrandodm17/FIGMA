import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const loginSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function Login() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      await login(data.email, data.senha)
    } catch {
      toast.error('E-mail ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-xl bg-green-600 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h1 className="text-xl font-bold text-[#F5F5F5]">Painel Administrativo</h1>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 space-y-5"
        >
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-[#F5F5F5]">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="senha" className="block text-sm font-medium text-[#F5F5F5]">
              Senha
            </label>
            <div className="relative">
              <Input
                id="senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pr-10"
                {...register('senha')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#F5F5F5] transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.senha && (
              <p className="text-xs text-red-500">{errors.senha.message}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            Entrar
          </Button>

          {/* Forgot password */}
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-[#9CA3AF] hover:text-green-500 transition-colors"
            >
              Esqueci minha senha
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
