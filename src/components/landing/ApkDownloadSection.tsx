import { Smartphone } from "lucide-react"

/**
 * ApkDownloadSection — CTA de download do APK Android.
 * Renderizado apenas quando NEXT_PUBLIC_APK_URL está definida.
 * Server Component.
 * @see intake-review/TASK-14/ST003
 */
export function ApkDownloadSection() {
  const apkUrl = process.env.NEXT_PUBLIC_APK_URL
  if (!apkUrl) return null

  return (
    <section
      data-testid="landing-apk-download"
      className="py-12 bg-green-700 text-white"
    >
      <div className="mx-auto max-w-6xl px-4 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Smartphone className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-lg leading-tight">Prato Solidário no seu celular</p>
            <p className="text-sm text-white/80 mt-0.5">
              Baixe o app Android e receba alertas de doações próximas a você.
            </p>
          </div>
        </div>
        <a
          href={apkUrl}
          data-testid="landing-apk-download-link"
          download
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-green-800 hover:bg-green-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-700"
        >
          <Smartphone className="h-4 w-4" aria-hidden="true" />
          Baixar APK
        </a>
      </div>
    </section>
  )
}
