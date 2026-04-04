import { PublicNavbar } from "@/components/shared/public-navbar"

export default function PatrocinioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  )
}
