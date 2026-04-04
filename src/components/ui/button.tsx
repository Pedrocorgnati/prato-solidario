"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary-raw)] text-white hover:bg-[var(--color-primary-hover)]",
        secondary:
          "bg-[var(--color-secondary-raw)] text-[var(--color-on-secondary)] hover:bg-[var(--color-secondary-raw)]/90",
        ghost:
          "hover:bg-[var(--color-muted-raw)] hover:text-[var(--color-text-primary)]",
        destructive:
          "bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/90",
        outline:
          "border border-[var(--color-border-raw)] bg-transparent hover:bg-[var(--color-muted-raw)] hover:text-[var(--color-text-primary)]",
        link: "text-[var(--color-primary-raw)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn(
          buttonVariants({ variant, size }),
          (children as React.ReactElement<{ className?: string }>).props.className,
          className
        ),
      })
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
