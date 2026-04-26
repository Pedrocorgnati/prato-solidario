import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const isDev = process.env.NODE_ENV === 'development'

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_APP_URL_WWW,
  'https://pratosolidario.vercel.app',
].filter(Boolean) as string[]

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      // ─── Cache imutável para assets Next.js com hash ───────────────────────
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // ─── Cache para imagens públicas (sem hash) ────────────────────────────
      {
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      // ─── Cache para fontes (imutáveis — carregadas via next/font) ──────────
      {
        source: '/fonts/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // ─── CORS para /api/v1/* (consumo por Expo WebView / apps externos) ───
      // Rotas internas (/api/v1/internal/crons/*) e /api/health são server-to-server:
      // não recebem headers CORS — filtradas pelo matcher abaixo.
      {
        source: '/api/v1/((?!internal/).*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: ALLOWED_ORIGINS.join(', '),
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-CSRF-Token' },
        ],
      },
      // ─── Security headers globais ──────────────────────────────────────────
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://api.mapbox.com",
              "font-src 'self'",
              // /monitoring = Sentry tunnel route (evita bloqueio de ad-blockers)
              "connect-src 'self' https://*.supabase.co https://api.mapbox.com wss://*.supabase.co https://*.ingest.sentry.io",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ]
  },
}

// Bypass em dev: withSentryConfig lê manifestos de produção e pode gerar erros
// em desenvolvimento sem SENTRY_DSN configurado.
export default isDev
  ? nextConfig
  : withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      // Rota de tunnel: evita bloqueio de ad-blockers
      tunnelRoute: '/monitoring',
      // Não logar warnings do Sentry no build
      silent: !process.env.CI,
      // Source maps: upload apenas em produção, não publicar no bundle
      sourcemaps: {
        disable: process.env.VERCEL_ENV !== 'production',
      },
    })
