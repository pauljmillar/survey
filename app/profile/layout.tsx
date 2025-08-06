import { SidebarLayout } from '@/components/navigation/sidebar-layout'

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SidebarLayout>{children}</SidebarLayout>
}
