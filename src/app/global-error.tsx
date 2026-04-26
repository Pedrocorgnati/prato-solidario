'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

/**
 * Global Error Boundary — ativado apenas quando app/layout.tsx falha.
 * Deve incluir <html> e <body> próprios (Next.js requirement).
 * NÃO usar componentes que dependam de providers (AuthProvider, Toaster).
 * @see module-7-layout-navigation/TASK-5/ST003
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#FFFDF7",
          color: "#1C2B1F",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "400px" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Erro crítico
          </h1>
          <p style={{ color: "#57534E", marginBottom: "1.5rem" }}>
            Ocorreu um erro inesperado. Por favor, recarregue a página.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{
                background: "#2D8659",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.625rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Tentar novamente
            </button>
            <button
              onClick={() => { window.location.href = "/" }}
              style={{
                background: "transparent",
                color: "#1C2B1F",
                border: "1px solid #DDD8D0",
                borderRadius: "0.5rem",
                padding: "0.625rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Recarregar página
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
