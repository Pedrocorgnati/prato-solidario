import { ImageResponse } from "next/og"

/**
 * GET /og-image
 * OG image gerada dinamicamente para a landing page.
 * 1200×630 — identidade visual verde (#166534).
 * @see module-18-landing-page/TASK-3/ST002
 */
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#166534",
          gap: 24,
          padding: "48px 80px",
        }}
      >
        {/* Logo text */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Plate icon */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
            }}
          >
            🍽️
          </div>
          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "white",
              letterSpacing: "-2px",
            }}
          >
            Prato Solidário
          </span>
        </div>

        {/* Tagline */}
        <span
          style={{
            fontSize: 36,
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Conectando quem tem com quem precisa
        </span>

        {/* CTA chip */}
        <div
          style={{
            marginTop: 16,
            backgroundColor: "white",
            borderRadius: 48,
            padding: "12px 32px",
            display: "flex",
          }}
        >
          <span
            style={{
              color: "#166534",
              fontWeight: 700,
              fontSize: 24,
            }}
          >
            pratosolidario.com.br
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
