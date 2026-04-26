import { PublicNavbar } from "@/components/shared/public-navbar"
import { Footer } from "@/components/shared/footer"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  )
}
