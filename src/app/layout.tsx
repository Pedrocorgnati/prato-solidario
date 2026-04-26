import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/shared/theme-provider"
import { AuthProvider } from "@/components/providers/AuthProvider"
import { DevToolsLoader } from "@/components/dev/DevToolsLoader"
import { SkipLinks } from "@/components/shared/skip-links"
import { OfflineBanner } from "@/components/shared/offline-banner"

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: {
    template: "%s | Prato Solidário",
    default: "Prato Solidário — Transforme seu excedente em solidariedade",
  },
  description:
    "Conectamos doadores de alimentos com receptores que precisam de refeições. Junte-se à corrente do bem.",
  openGraph: {
    title: "Prato Solidário",
    description: "Transforme seu excedente em solidariedade",
    images: ["/images/og-image.png"],
    locale: "pt_BR",
    type: "website",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2D8659",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <SkipLinks />
            <OfflineBanner />
            {children}
          </AuthProvider>
          <DevToolsLoader />
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              classNames: {
                toast: "font-sans",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
