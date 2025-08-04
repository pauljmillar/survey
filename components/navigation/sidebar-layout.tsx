"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"

interface SidebarLayoutProps {
  children: React.ReactNode
  className?: string
}

export function SidebarLayout({ children, className }: SidebarLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  // Sync with sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-expanded")
    if (savedState !== null) {
      setSidebarExpanded(JSON.parse(savedState))
    }

    const handleStorageChange = () => {
      const savedState = localStorage.getItem("sidebar-expanded")
      if (savedState !== null) {
        setSidebarExpanded(JSON.parse(savedState))
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
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