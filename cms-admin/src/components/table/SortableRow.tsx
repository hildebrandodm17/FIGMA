import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'

interface SortableRowProps {
  id: string
  children: ReactNode
}

export function SortableRow({ id, children }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-[#2A2A2A] last:border-b-0 hover:bg-[#0D0D0D]/50 transition-colors"
    >
      <td className="w-10 px-2">
        <button
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing text-[#9CA3AF] hover:text-[#F5F5F5] transition-colors"
        >
          <GripVertical size={16} />
        </button>
      </td>
      {children}
    </tr>
  )
}
