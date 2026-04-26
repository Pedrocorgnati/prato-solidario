"use client"

/**
 * PasswordInput — input de senha com barra de força + checklist inline.
 * @see intake-review TASK-8/ST002 (CL-253)
 *
 * Ressalva: substituição nos 5 cadastros (doador, ong, marmitaria, patrocinador,
 * restaurante, receptor) deve ser feita manualmente. Apenas este export e
 * integração no cadastro principal foram entregues.
 */

import * as React from "react"
import { Eye, EyeOff, Check, X } from "lucide-react"
import { scorePassword, passwordChecklist, STRENGTH_LABELS } from "@/lib/validation/password"

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  id?: string
  value: string
  onChange: (value: string) => void
  showChecklist?: boolean
  showStrength?: boolean
}

const STRENGTH_COLORS: Record<0 | 1 | 2 | 3, string> = {
  0: "bg-red-500",
  1: "bg-orange-500",
  2: "bg-yellow-500",
  3: "bg-green-500",
}

const STRENGTH_WIDTHS: Record<0 | 1 | 2 | 3, string> = {
  0: "w-1/4",
  1: "w-2/4",
  2: "w-3/4",
  3: "w-full",
}

export function PasswordInput({
  id = "password",
  value,
  onChange,
  showChecklist = true,
  showStrength = true,
  className,
  ...inputProps
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false)
  const score = scorePassword(value)
  const checklist = passwordChecklist(value)

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          {...inputProps}
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={
            className ??
            "w-full rounded-md border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 pr-10 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-raw)]"
          }
          aria-describedby={`${id}-strength`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div id={`${id}-strength`} className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-muted-raw)]">
            <div
              className={`h-full transition-all ${STRENGTH_COLORS[score]} ${STRENGTH_WIDTHS[score]}`}
              aria-hidden="true"
            />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]" aria-live="polite">
            Força da senha: <span className="font-medium">{STRENGTH_LABELS[score]}</span>
          </p>
        </div>
      )}

      {showChecklist && value.length > 0 && (
        <ul className="space-y-1 text-xs">
          {checklist.map((item) => (
            <li
              key={item.key}
              className={`flex items-center gap-1.5 ${
                item.passed ? "text-green-700 dark:text-green-400" : "text-[var(--color-text-muted)]"
              }`}
            >
              {item.passed ? (
                <Check className="h-3 w-3" aria-hidden="true" />
              ) : (
                <X className="h-3 w-3" aria-hidden="true" />
              )}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
