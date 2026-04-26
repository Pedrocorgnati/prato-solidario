"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { isValidCpf } from "@/validators/cpf"
import { isValidCnpj } from "@/validators/cnpj"
import { formatCpf, formatCnpj, stripMask } from "@/utils/formatters"

interface DocumentInputProps {
  type?: "cpf" | "cnpj" | "auto"
  value?: string
  onChange?: (value: string) => void
  error?: string
  label?: string
  name?: string
  className?: string
  required?: boolean
}

export const DocumentInput = React.forwardRef<HTMLInputElement, DocumentInputProps>(
  function DocumentInput(
    {
      type = "auto",
      value = "",
      onChange,
      error,
      label,
      name,
      className,
      required,
    },
    ref
  ) {
    const [internalType, setInternalType] = React.useState<"cpf" | "cnpj">("cpf")

    const effectiveType = type === "auto" ? internalType : type
    const displayLabel = label ?? (effectiveType === "cpf" ? "CPF" : "CNPJ")
    const placeholder = effectiveType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"
    const maxLength = effectiveType === "cpf" ? 14 : 18

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = stripMask(e.target.value)
      if (type === "auto") {
        setInternalType(raw.length > 11 ? "cnpj" : "cpf")
      }
      const formatted =
        (type === "auto" ? raw.length > 11 : type === "cnpj")
          ? formatCnpj(raw)
          : formatCpf(raw)
      onChange?.(formatted)
    }

    const isValid = value
      ? effectiveType === "cpf"
        ? isValidCpf(value)
        : isValidCnpj(value)
      : true

    const displayError = error || (!isValid && value ? `${effectiveType.toUpperCase()} inválido` : "")

    return (
      <div className={cn("space-y-1", className)}>
        <Label className="text-sm font-medium">
          {type === "auto" ? "CPF / CNPJ" : displayLabel}
          {required && <span className="text-[var(--color-danger)] ml-1">*</span>}
        </Label>
        <Input
          ref={ref}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={type === "auto" ? "CPF ou CNPJ" : placeholder}
          maxLength={maxLength}
          inputMode="numeric"
          className={cn(
            displayError && "border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]"
          )}
          aria-invalid={!!displayError}
        />
        {displayError && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">
            {displayError}
          </p>
        )}
      </div>
    )
  }
)
