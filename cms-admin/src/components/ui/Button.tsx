import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { Spinner } from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
}

const variantStyles = {
  primary:
    'bg-green-600 text-white hover:bg-green-500 focus-visible:ring-green-500',
  secondary:
    'bg-[#1A1A1A] text-[#F5F5F5] border border-[#2A2A2A] hover:bg-[#252525] focus-visible:ring-[#2A2A2A]',
  danger:
    'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500',
  ghost:
    'bg-transparent text-[#9CA3AF] hover:bg-[#1A1A1A] hover:text-[#F5F5F5] focus-visible:ring-[#2A2A2A]',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-2.5 text-base gap-2',
}

const spinnerSize = {
  sm: 'sm' as const,
  md: 'sm' as const,
  lg: 'md' as const,
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0D]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Spinner size={spinnerSize[size]} />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
