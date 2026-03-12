import { cn } from '../../utils/cn'
import type { ReactNode } from 'react'

interface BadgeProps {
  variant: 'active' | 'inactive' | 'draft' | 'published'
  children: ReactNode
}

const variantStyles = {
  active: 'bg-green-600/15 text-green-400 ring-green-500/20',
  published: 'bg-green-600/15 text-green-400 ring-green-500/20',
  inactive: 'bg-gray-600/15 text-gray-400 ring-gray-500/20',
  draft: 'bg-amber-600/15 text-amber-400 ring-amber-500/20',
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantStyles[variant]
      )}
    >
      {children}
    </span>
  )
}
