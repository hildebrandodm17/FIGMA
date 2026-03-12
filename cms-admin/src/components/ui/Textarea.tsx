import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  showCount?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, showCount = false, maxLength, value, defaultValue, ...props }, ref) => {
    const currentLength = typeof value === 'string'
      ? value.length
      : typeof defaultValue === 'string'
        ? defaultValue.length
        : 0

    return (
      <div className="relative">
        <textarea
          ref={ref}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          className={cn(
            'w-full rounded-lg border bg-[#141414] border-[#2A2A2A] px-3 py-2 text-sm text-[#F5F5F5]',
            'placeholder:text-[#6B7280]',
            'focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors resize-y min-h-[80px]',
            className
          )}
          {...props}
        />
        {showCount && maxLength && (
          <span className="absolute bottom-2 right-3 text-xs text-[#6B7280]">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
