"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"

interface SidebarLayoutProps {
  children: React.ReactNode
  className?: string
}

export function SidebarLayout({ children, className }: SidebarLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  // Listen for mouse events on the sidebar to sync state
  useEffect(() => {
    const handleMouseEnter = () => setSidebarExpanded(true)
    const handleMouseLeave = () => setSidebarExpanded(false)

    const sidebar = document.querySelector('[data-sidebar]')
    if (sidebar) {
      sidebar.addEventListener('mouseenter', handleMouseEnter)
      sidebar.addEventListener('mouseleave', handleMouseLeave)
      
      return () => {
        sidebar.removeEventListener('mouseenter', handleMouseEnter)
        sidebar.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar data-sidebar />
      <main 
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          sidebarExpanded ? "ml-64" : "ml-16",
          className
        )}
      >
        <div className="h-full overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ")
} 