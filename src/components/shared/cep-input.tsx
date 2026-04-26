"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { lookupCep } from "@/validators/cep"
import { formatCep, stripMask } from "@/utils/formatters"

interface CepInputProps {
  value?: string
  onChange?: (value: string) => void
  onAddressFill?: (data: {
    logradouro: string
    bairro: string
    localidade: string
    uf: string
  }) => void
  disabled?: boolean
  error?: string
  label?: string
  name?: string
  className?: string
  required?: boolean
}

export const CepInput = React.forwardRef<HTMLInputElement, CepInputProps>(
  function CepInput(
    {
      value = "",
      onChange,
      onAddressFill,
      disabled,
      error,
      label = "CEP",
      name,
      className,
      required,
    },
    ref
  ) {
    const [loading, setLoading] = React.useState(false)
    const [fetchError, setFetchError] = React.useState("")
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    // Cleanup do debounce ao desmontar
    React.useEffect(() => {
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    }, [])

    async function debouncedLookup(raw: string) {
      if (timerRef.current) clearTimeout(timerRef.current)

      timerRef.current = setTimeout(async () => {
        setLoading(true)
        setFetchError("")
        try {
          const address = await lookupCep(raw)
          if (!address) {
            setFetchError("CEP não encontrado")
            return
          }
          onAddressFill?.({
            logradouro: address.logradouro,
            bairro: address.bairro,
            localidade: address.cidade,
            uf: address.estado,
          })
        } catch {
          setFetchError("Erro ao buscar CEP")
        } finally {
          setLoading(false)
        }
      }, 500)
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = stripMask(e.target.value)
      const formatted = formatCep(raw)
      onChange?.(formatted)
      if (raw.length === 8) {
        debouncedLookup(raw)
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
            ref={ref}
            id="cep-input"
            name={name}
            value={value}
            onChange={handleChange}
            disabled={disabled}
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
)
