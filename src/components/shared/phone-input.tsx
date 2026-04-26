"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { formatPhone } from "@/utils/formatters"

interface PhoneInputProps {
  value?: string
  onChange?: (value: string) => void
  error?: string
  label?: string
  name?: string
  className?: string
  required?: boolean
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    {
      value = "",
      onChange,
      error,
      label = "Telefone",
      name,
      className,
      required,
    },
    ref
  ) {
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const formatted = formatPhone(e.target.value)
      onChange?.(formatted)
    }

    return (
      <div className={cn("space-y-1", className)}>
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-[var(--color-danger)] ml-1">*</span>}
        </Label>
        <Input
          ref={ref}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder="(00) 00000-0000"
          maxLength={15}
          inputMode="tel"
          type="tel"
          className={cn(
            error && "border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]"
          )}
          aria-invalid={!!error}
        />
        {error && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
