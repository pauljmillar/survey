import { SidebarLayout } from '@/components/navigation/sidebar-layout'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SidebarLayout>{children}</SidebarLayout>
}