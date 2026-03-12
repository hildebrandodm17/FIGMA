import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import ImageExtension from '@tiptap/extension-image'
import UnderlineExtension from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import Placeholder from '@tiptap/extension-placeholder'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import Highlight from '@tiptap/extension-highlight'
import { EditorToolbar } from './EditorToolbar'

interface RichEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function RichEditor({ content, onChange, placeholder = 'Comece a escrever...' }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-green-500 underline cursor-pointer',
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      UnderlineExtension,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      Placeholder.configure({
        placeholder,
      }),
      Superscript,
      Subscript,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-invert prose-sm max-w-none px-4 py-3 min-h-[200px] focus:outline-none text-[#F5F5F5]',
      },
    },
  })

  if (!editor) return null

  return (
    <div className="border border-[#2A2A2A] rounded-lg overflow-hidden bg-[#141414]">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
