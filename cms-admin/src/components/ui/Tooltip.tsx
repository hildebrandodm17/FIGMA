import { type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface TooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom'
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  return (
    <div className="relative inline-flex group">
      {children}
      <div
        role="tooltip"
        className={cn(
          'absolute left-1/2 -translate-x-1/2 z-50',
          'invisible opacity-0 group-hover:visible group-hover:opacity-100',
          'transition-opacity duration-150',
          'px-2.5 py-1.5 text-xs font-medium text-[#F5F5F5] bg-[#2A2A2A] rounded-lg',
          'whitespace-nowrap border border-[#3A3A3A] shadow-lg',
          'pointer-events-none',
          position === 'top' && 'bottom-full mb-2',
          position === 'bottom' && 'top-full mt-2'
        )}
      >
        {content}
        <span
          className={cn(
            'absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2A2A2A] border-[#3A3A3A] rotate-45',
            position === 'top' && 'top-full -mt-1 border-b border-r',
            position === 'bottom' && 'bottom-full -mb-1 border-t border-l'
          )}
        />
      </div>
    </div>
  )
}
