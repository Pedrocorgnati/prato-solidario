"use client"

import * as React from "react"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { uploadPhoto } from "@/actions/users"

interface PhotoUploadProps {
  value?: string
  onChange?: (url: string) => void
  onRemove?: () => void
  label?: string
  accept?: string
  maxSizeMb?: number
  className?: string
}

export function PhotoUpload({
  value,
  onChange,
  onRemove,
  label = "Foto",
  accept = "image/*",
  maxSizeMb = 5,
  className,
}: PhotoUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [preview, setPreview] = React.useState<string>(value || "")
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError("")
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo ${maxSizeMb}MB.`)
      return
    }
    // Exibe preview imediato (optimistic)
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    // RESOLVED: Upload para Supabase Storage via Server Action
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const result = await uploadPhoto(formData)
      if (result.error) {
        setError("Erro ao enviar a foto. Tente novamente.")
        setPreview("")
        return
      }
      // Usa URL do Supabase Storage quando disponível, mantém blob local como fallback
      onChange?.(result.data?.url ?? localUrl)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleRemove() {
    setPreview("")
    onRemove?.()
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className={cn("space-y-1", className)}>
      <span className="text-sm font-medium text-[var(--color-text-primary)]">{label}</span>
      {preview ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="h-32 w-32 rounded-lg object-cover border border-[var(--color-border-raw)]"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          {!uploading && (
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-danger)] text-white hover:opacity-90"
              aria-label="Remover foto"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors",
            isDragging
              ? "border-[var(--color-primary-raw)] bg-[var(--color-primary-raw)]/5"
              : "border-[var(--color-border-raw)] hover:border-[var(--color-primary-raw)] hover:bg-[var(--color-surface)]"
          )}
        >
          <ImageIcon className="h-8 w-8 text-[var(--color-text-muted)]" />
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Clique ou arraste uma imagem
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              PNG, JPG até {maxSizeMb}MB
            </p>
          </div>
          <Button variant="outline" size="sm" type="button">
            <Upload className="mr-2 h-4 w-4" />
            Escolher arquivo
          </Button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        aria-hidden
      />
      {error && (
        <p className="text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
