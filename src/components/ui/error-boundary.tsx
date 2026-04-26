'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Algo deu errado
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.
            </p>
          </div>
          <Button
            variant="default"
            size="md"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Tentar novamente
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
export { ErrorBoundary }
