import { Menu } from 'lucide-react'

interface MobileNavProps {
  onToggle: () => void
}

export function MobileNav({ onToggle }: MobileNavProps) {
  return (
    <button
      onClick={onToggle}
      className="md:hidden p-2 rounded-lg text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] transition-colors"
      aria-label="Abrir menu"
    >
      <Menu size={22} />
    </button>
  )
}
