import type { ReactNode } from 'react'

interface PageWrapperProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export function PageWrapper({ title, subtitle, actions, children }: PageWrapperProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F5]">{title}</h1>
          {subtitle && (
            <p className="text-sm text-[#9CA3AF] mt-1">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
