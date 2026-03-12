import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor
}

interface ToolbarButton {
  icon: React.ReactNode
  action: () => void
  isActive?: boolean
  title: string
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const groups: ToolbarButton[][] = [
    // Text formatting
    [
      {
        icon: <Bold size={16} />,
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: editor.isActive('bold'),
        title: 'Negrito',
      },
      {
        icon: <Italic size={16} />,
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: editor.isActive('italic'),
        title: 'Italico',
      },
      {
        icon: <Underline size={16} />,
        action: () => editor.chain().focus().toggleUnderline().run(),
        isActive: editor.isActive('underline'),
        title: 'Sublinhado',
      },
      {
        icon: <Strikethrough size={16} />,
        action: () => editor.chain().focus().toggleStrike().run(),
        isActive: editor.isActive('strike'),
        title: 'Tachado',
      },
    ],
    // Headings
    [
      {
        icon: <Heading1 size={16} />,
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: editor.isActive('heading', { level: 1 }),
        title: 'Titulo 1',
      },
      {
        icon: <Heading2 size={16} />,
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: editor.isActive('heading', { level: 2 }),
        title: 'Titulo 2',
      },
      {
        icon: <Heading3 size={16} />,
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: editor.isActive('heading', { level: 3 }),
        title: 'Titulo 3',
      },
    ],
    // Lists and blocks
    [
      {
        icon: <List size={16} />,
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: editor.isActive('bulletList'),
        title: 'Lista',
      },
      {
        icon: <ListOrdered size={16} />,
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: editor.isActive('orderedList'),
        title: 'Lista numerada',
      },
      {
        icon: <Quote size={16} />,
        action: () => editor.chain().focus().toggleBlockquote().run(),
        isActive: editor.isActive('blockquote'),
        title: 'Citacao',
      },
      {
        icon: <Code size={16} />,
        action: () => editor.chain().focus().toggleCodeBlock().run(),
        isActive: editor.isActive('codeBlock'),
        title: 'Codigo',
      },
    ],
    // Link
    [
      {
        icon: <Link size={16} />,
        action: () => {
          const url = window.prompt('URL do link:')
          if (url) {
            editor.chain().focus().setLink({ href: url }).run()
          } else {
            editor.chain().focus().unsetLink().run()
          }
        },
        isActive: editor.isActive('link'),
        title: 'Link',
      },
    ],
    // Alignment
    [
      {
        icon: <AlignLeft size={16} />,
        action: () => editor.chain().focus().setTextAlign('left').run(),
        isActive: editor.isActive({ textAlign: 'left' }),
        title: 'Alinhar esquerda',
      },
      {
        icon: <AlignCenter size={16} />,
        action: () => editor.chain().focus().setTextAlign('center').run(),
        isActive: editor.isActive({ textAlign: 'center' }),
        title: 'Centralizar',
      },
      {
        icon: <AlignRight size={16} />,
        action: () => editor.chain().focus().setTextAlign('right').run(),
        isActive: editor.isActive({ textAlign: 'right' }),
        title: 'Alinhar direita',
      },
      {
        icon: <AlignJustify size={16} />,
        action: () => editor.chain().focus().setTextAlign('justify').run(),
        isActive: editor.isActive({ textAlign: 'justify' }),
        title: 'Justificar',
      },
    ],
    // Undo/Redo
    [
      {
        icon: <Undo size={16} />,
        action: () => editor.chain().focus().undo().run(),
        title: 'Desfazer',
      },
      {
        icon: <Redo size={16} />,
        action: () => editor.chain().focus().redo().run(),
        title: 'Refazer',
      },
    ],
  ]

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-[#141414] border-b border-[#2A2A2A]">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center">
          {gi > 0 && (
            <div className="w-px h-5 bg-[#2A2A2A] mx-1.5" />
          )}
          {group.map((btn) => (
            <button
              key={btn.title}
              type="button"
              onClick={btn.action}
              title={btn.title}
              className={`
                p-1.5 rounded transition-colors
                ${btn.isActive
                  ? 'bg-green-500/20 text-green-500'
                  : 'text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#2A2A2A]'
                }
              `}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
