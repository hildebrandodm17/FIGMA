interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-[#F5F5F5]">{label}</label>
      )}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className="w-10 h-10 rounded-lg border border-[#2A2A2A] cursor-pointer overflow-hidden"
            style={{ backgroundColor: value || '#000000' }}
          >
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => {
            const val = e.target.value
            if (/^#?[0-9A-Fa-f]{0,6}$/.test(val)) {
              onChange(val.startsWith('#') ? val : `#${val}`)
            }
          }}
          placeholder="#000000"
          className="w-28 px-3 py-2 text-sm text-[#F5F5F5] bg-[#141414] border border-[#2A2A2A] rounded-lg focus:outline-none focus:border-green-500 transition-colors font-mono"
        />
      </div>
    </div>
  )
}
