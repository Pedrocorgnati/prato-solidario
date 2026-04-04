import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/shared/theme-provider"
import { DevToolsLoader } from "@/components/dev/DevToolsLoader"

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "Prato Solidário — Transforme seu excedente em solidariedade",
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
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md"
          >
            Ir para conteúdo
          </a>
          {children}
          <DevToolsLoader />
          <Toaster
            position="top-right"
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
