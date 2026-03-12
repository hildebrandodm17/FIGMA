import { Pencil, Eye, Trash2 } from 'lucide-react'

interface TableActionsProps {
  onEdit?: () => void
  onView?: () => void
  onDelete?: () => void
  editLabel?: string
  viewLabel?: string
  deleteLabel?: string
}

export function TableActions({
  onEdit,
  onView,
  onDelete,
  editLabel = 'Editar',
  viewLabel = 'Visualizar',
  deleteLabel = 'Deletar',
}: TableActionsProps) {
  const actions = [
    onView && {
      handler: onView,
      label: viewLabel,
      icon: <Eye size={14} />,
      className: 'text-[#9CA3AF] hover:text-[#F5F5F5]',
    },
    onEdit && {
      handler: onEdit,
      label: editLabel,
      icon: <Pencil size={14} />,
      className: 'text-[#9CA3AF] hover:text-green-500',
    },
    onDelete && {
      handler: onDelete,
      label: deleteLabel,
      icon: <Trash2 size={14} />,
      className: 'text-[#9CA3AF] hover:text-red-500',
    },
  ].filter(Boolean) as { handler: () => void; label: string; icon: React.ReactNode; className: string }[]

  if (actions.length === 0) return null

  return (
    <div className="flex items-center gap-1">
      {actions.map((action, i) => (
        <span key={action.label} className="flex items-center">
          {i > 0 && <span className="text-[#2A2A2A] mx-1">|</span>}
          <button
            onClick={action.handler}
            title={action.label}
            className={`flex items-center gap-1 px-1.5 py-1 text-xs font-medium rounded transition-colors ${action.className}`}
          >
            {action.icon}
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        </span>
      ))}
    </div>
  )
}
