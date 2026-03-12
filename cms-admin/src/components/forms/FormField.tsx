import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  hint?: string
  children: ReactNode
}

export function FormField({ label, error, required, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[#F5F5F5]">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-[#9CA3AF]">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
