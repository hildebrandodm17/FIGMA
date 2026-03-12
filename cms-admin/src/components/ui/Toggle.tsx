import { Field, Label, Switch } from '@headlessui/react'
import { cn } from '../../utils/cn'

interface ToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label?: string
}

export function Toggle({ enabled, onChange, label }: ToggleProps) {
  return (
    <Field>
      <div className="flex items-center gap-3">
        <Switch
          checked={enabled}
          onChange={onChange}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
            'transition-colors duration-200 ease-in-out',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0D]',
            enabled ? 'bg-green-600' : 'bg-[#2A2A2A]'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0',
              'transition duration-200 ease-in-out',
              enabled ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </Switch>
        {label && (
          <Label className="text-sm text-[#F5F5F5] cursor-pointer">
            {label}
          </Label>
        )}
      </div>
    </Field>
  )
}
