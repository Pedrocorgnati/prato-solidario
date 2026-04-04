"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Step {
  label: string
  description?: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  orientation?: "horizontal" | "vertical"
  className?: string
}

export function StepIndicator({
  steps,
  currentStep,
  orientation = "horizontal",
  className,
}: StepIndicatorProps) {
  if (orientation === "vertical") {
    return (
      <div className={cn("flex flex-col gap-0", className)}>
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep
          const isActive = idx === currentStep
          return (
            <div key={idx} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isCompleted &&
                      "border-[var(--color-primary-raw)] bg-[var(--color-primary-raw)] text-white",
                    isActive &&
                      "border-[var(--color-primary-raw)] bg-white text-[var(--color-primary-raw)]",
                    !isCompleted &&
                      !isActive &&
                      "border-[var(--color-border-raw)] bg-[var(--color-muted-raw)] text-[var(--color-text-muted)]"
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      "mt-1 w-0.5 flex-1 min-h-6",
                      isCompleted
                        ? "bg-[var(--color-primary-raw)]"
                        : "bg-[var(--color-border-raw)]"
                    )}
                  />
                )}
              </div>
              <div className="pb-6 pt-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isActive
                      ? "text-[var(--color-primary-raw)]"
                      : isCompleted
                        ? "text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-muted)]"
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-0", className)}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep
        const isActive = idx === currentStep
        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  isCompleted &&
                    "border-[var(--color-primary-raw)] bg-[var(--color-primary-raw)] text-white",
                  isActive &&
                    "border-[var(--color-primary-raw)] bg-white text-[var(--color-primary-raw)]",
                  !isCompleted &&
                    !isActive &&
                    "border-[var(--color-border-raw)] bg-[var(--color-muted-raw)] text-[var(--color-text-muted)]"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-medium md:block",
                  isActive
                    ? "text-[var(--color-primary-raw)]"
                    : isCompleted
                      ? "text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-muted)]"
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-12 md:w-20 flex-shrink-0 transition-colors",
                  isCompleted
                    ? "bg-[var(--color-primary-raw)]"
                    : "bg-[var(--color-border-raw)]"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
