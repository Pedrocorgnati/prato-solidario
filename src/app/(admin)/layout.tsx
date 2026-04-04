import { AdminLayout } from "@/components/shared/admin-layout"

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>
}
