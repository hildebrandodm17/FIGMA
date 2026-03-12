import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-[#141414] border-[#2A2A2A] px-3 py-2 text-sm text-[#F5F5F5]',
          'focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors appearance-none',
          'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")]',
          'bg-no-repeat bg-[right_0.75rem_center] pr-10',
          className
        )}
        {...props}
      >
        {children}
      </select>
    )
  }
)

Select.displayName = 'Select'
