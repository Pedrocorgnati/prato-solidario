"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { formatCEP } from "@/lib/validations"

interface CepData {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

interface CepInputProps {
  value?: string
  onChange?: (value: string) => void
  onAddressFill?: (data: CepData) => void
  error?: string
  label?: string
  className?: string
  required?: boolean
}

export function CepInput({
  value = "",
  onChange,
  onAddressFill,
  error,
  label = "CEP",
  className,
  required,
}: CepInputProps) {
  const [loading, setLoading] = React.useState(false)
  const [fetchError, setFetchError] = React.useState("")

  async function lookupCep(cep: string) {
    const stripped = cep.replace(/\D/g, "")
    if (stripped.length !== 8) return
    setLoading(true)
    setFetchError("")
    try {
      const res = await fetch(`https://viacep.com.br/ws/${stripped}/json/`)
      const data = await res.json()
      if (data.erro) {
        setFetchError("CEP não encontrado")
        return
      }
      onAddressFill?.(data as CepData)
    } catch {
      setFetchError("Erro ao buscar CEP")
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCEP(e.target.value)
    onChange?.(formatted)
    if (formatted.replace(/\D/g, "").length === 8) {
      lookupCep(formatted)
    }
  }

  const displayError = error || fetchError

  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor="cep-input" className="text-sm font-medium">
        {label}
        {required && <span className="text-[var(--color-danger)] ml-1">*</span>}
      </Label>
      <div className="relative">
        <Input
          id="cep-input"
          value={value}
          onChange={handleChange}
          placeholder="00000-000"
          maxLength={9}
          inputMode="numeric"
          className={cn(
            "pr-9",
            displayError && "border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]"
          )}
          aria-describedby={displayError ? "cep-error" : undefined}
          aria-invalid={!!displayError}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--color-text-muted)]" />
        )}
      </div>
      {displayError && (
        <p id="cep-error" className="text-xs text-[var(--color-danger)]" role="alert">
          {displayError}
        </p>
      )}
    </div>
  )
}
