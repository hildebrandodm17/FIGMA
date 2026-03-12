import { useState, useRef } from 'react'
import { Upload, X, Plus } from 'lucide-react'
import arquivoService from '../../services/arquivoService'

interface MultiImageUploadProps {
  value?: string[]
  onChange: (urls: string[]) => void
}

export function MultiImageUpload({ value = [], onChange }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (files: FileList) => {
    const validFiles = Array.from(files).filter((f) => {
      if (!f.type.startsWith('image/')) return false
      if (f.size > 10 * 1024 * 1024) return false
      return true
    })

    if (validFiles.length === 0) {
      setError('Nenhum arquivo valido selecionado')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const uploadPromises = validFiles.map((file) => arquivoService.upload(file))
      const results = await Promise.all(uploadPromises)
      const newUrls = results.map((r) => r.url)
      onChange([...value, ...newUrls])
    } catch {
      setError('Erro ao enviar imagens. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files)
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = (index: number) => {
    const updated = value.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }

  return (
    <div className="space-y-3">
      {/* Image grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative group rounded-lg overflow-hidden border border-[#2A2A2A] aspect-square bg-[#141414]"
            >
              <img
                src={url}
                alt={`Imagem ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1.5 right-1.5 p-1 bg-red-600/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {/* Add more button */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#2A2A2A] aspect-square bg-[#141414] hover:border-[#9CA3AF] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Plus size={24} className="text-[#9CA3AF]" />
            <span className="text-xs text-[#9CA3AF]">Adicionar</span>
          </button>
        </div>
      )}

      {/* Empty drop zone */}
      {value.length === 0 && (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-3 h-40 rounded-lg border-2 border-dashed border-[#2A2A2A] bg-[#141414] hover:border-[#9CA3AF] transition-colors cursor-pointer"
        >
          {uploading ? (
            <div className="flex items-center gap-2 text-[#9CA3AF]">
              <div className="w-4 h-4 border-2 border-[#9CA3AF] border-t-green-500 rounded-full animate-spin" />
              <span className="text-sm">Enviando...</span>
            </div>
          ) : (
            <>
              <Upload size={28} className="text-[#9CA3AF]" />
              <div className="text-center">
                <p className="text-sm text-[#9CA3AF]">
                  Arraste imagens ou <span className="text-green-500">clique para selecionar</span>
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">Selecione multiplas imagens</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}
