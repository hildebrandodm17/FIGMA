import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 text-[#9CA3AF]">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-[#F5F5F5] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#9CA3AF] max-w-sm mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
