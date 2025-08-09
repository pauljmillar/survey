"use client"

import { useAuth } from "@/hooks/use-auth"
import { SidebarLayout } from "@/components/navigation/sidebar-layout"
import { TopNavBar } from "@/components/top-nav-bar"

interface ActivityLayoutProps {
  children: React.ReactNode
}

export default function ActivityLayout({ children }: ActivityLayoutProps) {
  const { user } = useAuth()

  // If user is not authenticated, show regular layout with top nav
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavBar />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    )
  }

  // For authenticated users, use sidebar layout
  return (
    <SidebarLayout>
      <div className="p-6">
        {children}
      </div>
    </SidebarLayout>
  )
}