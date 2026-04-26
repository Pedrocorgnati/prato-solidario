"use client"

import * as React from "react"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StepIndicator } from "@/components/ui/step-indicator"
import { cn } from "@/lib/utils"

interface WizardStep {
  label: string
  content: React.ReactNode
}

interface WizardFormProps {
  steps: WizardStep[]
  onComplete: () => void
  /** Chamado antes de avançar para a próxima etapa. Retorne `false` para bloquear o avanço. */
  onBeforeNext?: (currentStep: number) => boolean
  completeLabel?: string
  completeDisabled?: boolean
  className?: string
}

export function WizardForm({
  steps,
  onComplete,
  onBeforeNext,
  completeLabel = "Finalizar",
  completeDisabled = false,
  className,
}: WizardFormProps) {
  const [current, setCurrent] = React.useState(0)
  const progress = ((current + 1) / steps.length) * 100

  return (
    <div data-testid="wizard-form" className={cn("flex flex-col min-h-screen", className)}>
      {/* Header sticky */}
      <div data-testid="wizard-form-progress" className="sticky top-0 z-20 bg-[var(--color-background-raw)] border-b border-[var(--color-border-raw)] px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-muted)]">
            Etapa {current + 1} de {steps.length}
          </span>
          <span className="text-xs font-medium text-[var(--color-primary-raw)]">
            {steps[current].label}
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <div className="hidden md:block pt-1">
          <StepIndicator
            steps={steps}
            currentStep={current}
            orientation="horizontal"
          />
        </div>
      </div>

      {/* Content */}
      <div data-testid="wizard-form-content" className="flex-1 px-4 py-6 pb-28">
        {steps[current].content}
      </div>

      {/* Fixed bottom buttons — mobile */}
      <div data-testid="wizard-form-actions" className="fixed bottom-0 left-0 right-0 bg-[var(--color-background-raw)] border-t border-[var(--color-border-raw)] px-4 py-3 flex flex-col gap-2"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
      >
        <Button
          data-testid="wizard-form-next-button"
          variant="default"
          size="lg"
          className="w-full"
          disabled={completeDisabled && current === steps.length - 1}
          onClick={() => {
            if (current < steps.length - 1) {
              const canAdvance = onBeforeNext ? onBeforeNext(current) : true
              if (canAdvance) setCurrent((c) => c + 1)
            } else {
              onComplete()
            }
          }}
        >
          {current < steps.length - 1 ? "Continuar" : completeLabel}
        </Button>
        {current > 0 && (
          <button
            data-testid="wizard-form-back-button"
            type="button"
            onClick={() => setCurrent((c) => c - 1)}
            className="flex items-center justify-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] py-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>
        )}
      </div>
    </div>
  )
}
