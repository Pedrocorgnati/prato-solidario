"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  snapPoint?: "half" | "full"
  className?: string
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  snapPoint = "half",
  className,
}: BottomSheetProps) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
          aria-hidden
        />
      )}
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-[var(--color-background-raw)] shadow-lg transition-transform duration-300 ease-out",
          snapPoint === "half" ? "max-h-[60vh]" : "max-h-[90vh]",
          open ? "translate-y-0" : "translate-y-full",
          className
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
      >
        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-[var(--color-border-raw)]" />
        {title && (
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="overflow-y-auto px-4 pb-4">{children}</div>
      </div>
    </>
  )
}
