import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-[#141414] border-[#2A2A2A] px-3 py-2 text-sm text-[#F5F5F5]',
          'placeholder:text-[#6B7280]',
          'focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors',
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
