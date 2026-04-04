import { BannerSlot } from "@/components/shared/banner-slot"
import { listBanners } from "@/actions/banners"

export const metadata = { title: "Meus Banners — Prato Solidário" }

export default async function BannersDoadorPage() {
  const { data } = await listBanners({ active: true })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Banners Publicitários</h1>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Seu saldo de exibições de banner. Ganhe banners ao atingir metas de doação.
      </p>
      <div className="space-y-4">
        <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Saldo de dias</p>
          <p className="text-3xl font-bold text-[var(--color-primary-raw)]">14 dias</p>
        </div>
        <BannerSlot />
      </div>
    </div>
  )
}
