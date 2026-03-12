import { useState, useRef, useCallback } from 'react'
import { Upload, X, RefreshCw } from 'lucide-react'
import arquivoService from '../../services/arquivoService'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  label?: string
}

export function ImageUpload({ value, onChange, onRemove, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Arquivo deve ser uma imagem')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Imagem deve ter no maximo 10MB')
      return
    }

    setError(null)
    setUploading(true)
    setProgress(0)

    // Simulate progress since arquivoService doesn't expose progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 15, 90))
    }, 200)

    try {
      const arquivo = await arquivoService.upload(file)
      setProgress(100)
      onChange(arquivo.url)
    } catch {
      setError('Erro ao enviar imagem. Tente novamente.')
    } finally {
      clearInterval(progressInterval)
      setUploading(false)
      setProgress(0)
    }
  }, [onChange])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    // Reset input
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-[#F5F5F5]">{label}</label>
      )}

      {value ? (
        <div className="relative group rounded-lg overflow-hidden border border-[#2A2A2A] bg-[#141414]">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] text-[#F5F5F5] text-sm rounded-lg border border-[#2A2A2A] hover:bg-[#2A2A2A] transition-colors"
            >
              <RefreshCw size={14} />
              Trocar imagem
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
              >
                <X size={14} />
                Remover
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            flex flex-col items-center justify-center gap-3 h-48 rounded-lg border-2 border-dashed cursor-pointer
            transition-colors
            ${dragOver
              ? 'border-green-500 bg-green-500/5'
              : 'border-[#2A2A2A] bg-[#141414] hover:border-[#9CA3AF]'
            }
            ${uploading ? 'pointer-events-none' : ''}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-32 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-[#9CA3AF]">Enviando... {progress}%</span>
            </div>
          ) : (
            <>
              <Upload size={28} className="text-[#9CA3AF]" />
              <div className="text-center">
                <p className="text-sm text-[#9CA3AF]">
                  Arraste uma imagem ou <span className="text-green-500">clique para selecionar</span>
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">PNG, JPG, WebP ate 10MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}
