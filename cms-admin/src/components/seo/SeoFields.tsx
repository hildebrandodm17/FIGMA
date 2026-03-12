import { useState } from 'react'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { FormField } from '../forms/FormField'
import { ImageUpload } from '../forms/ImageUpload'
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form'

interface SeoFieldsProps {
  register: UseFormRegister<any>
  errors: FieldErrors
  watch: UseFormWatch<any>
  setValue?: UseFormSetValue<any>
}

export function SeoFields({ register, errors, watch, setValue }: SeoFieldsProps) {
  const [open, setOpen] = useState(false)

  const metaTitle = watch('meta_title') || ''
  const metaDesc = watch('meta_desc') || ''

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#0D0D0D]/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Search size={16} className="text-green-500" />
          <span className="text-sm font-semibold text-[#F5F5F5]">SEO</span>
        </div>
        {open ? (
          <ChevronDown size={16} className="text-[#9CA3AF]" />
        ) : (
          <ChevronRight size={16} className="text-[#9CA3AF]" />
        )}
      </button>

      {/* Fields */}
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-[#2A2A2A]">
          <div className="pt-4">
            <FormField
              label="Meta Title"
              error={errors.meta_title?.message as string}
              hint={`${metaTitle.length}/70 caracteres`}
            >
              <input
                {...register('meta_title')}
                type="text"
                maxLength={70}
                placeholder="Titulo para mecanismos de busca"
                className="w-full px-3 py-2 text-sm text-[#F5F5F5] bg-[#141414] border border-[#2A2A2A] rounded-lg focus:outline-none focus:border-green-500 transition-colors"
              />
            </FormField>
          </div>

          <FormField
            label="Meta Description"
            error={errors.meta_desc?.message as string}
            hint={`${metaDesc.length}/160 caracteres`}
          >
            <textarea
              {...register('meta_desc')}
              maxLength={160}
              rows={3}
              placeholder="Descricao para mecanismos de busca"
              className="w-full px-3 py-2 text-sm text-[#F5F5F5] bg-[#141414] border border-[#2A2A2A] rounded-lg focus:outline-none focus:border-green-500 transition-colors resize-none"
            />
          </FormField>

          <ImageUpload
            label="OG Image"
            value={watch('og_image')}
            onChange={(url) => setValue?.('og_image', url)}
            onRemove={() => setValue?.('og_image', '')}
          />

          <FormField
            label="OG Title"
            error={errors.og_title?.message as string}
          >
            <input
              {...register('og_title')}
              type="text"
              placeholder="Titulo para redes sociais (opcional)"
              className="w-full px-3 py-2 text-sm text-[#F5F5F5] bg-[#141414] border border-[#2A2A2A] rounded-lg focus:outline-none focus:border-green-500 transition-colors"
            />
          </FormField>

          <FormField
            label="URL Canonica"
            error={errors.canonical_url?.message as string}
          >
            <input
              {...register('canonical_url')}
              type="url"
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm text-[#F5F5F5] bg-[#141414] border border-[#2A2A2A] rounded-lg focus:outline-none focus:border-green-500 transition-colors"
            />
          </FormField>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                {...register('indexavel')}
                type="checkbox"
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#2A2A2A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
            </label>
            <span className="text-sm text-[#F5F5F5]">Permitir indexacao (robots)</span>
          </div>
        </div>
      )}
    </div>
  )
}
