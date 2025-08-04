"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  ClipboardList, 
  Users, 
  Gift, 
  User, 
  Settings,
  BarChart3,
  Target,
  Activity,
  CreditCard,
  ShoppingCart,
  Star,
  Award,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  PlayCircle,
  Users2,
  Settings2,
  LogOut
} from "lucide-react"

interface SidebarProps {
  className?: string
}

interface MenuItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface MenuGroup {
  title: string
  items: MenuItem[]
  collapsible?: boolean
}

export function Sidebar({ className }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const sidebarRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { user, role } = useAuth()

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Preserve expanded state in localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-expanded")
    if (savedState !== null) {
      setIsExpanded(JSON.parse(savedState))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", JSON.stringify(isExpanded))
  }, [isExpanded])

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupTitle)) {
        newSet.delete(groupTitle)
      } else {
        newSet.add(groupTitle)
      }
      return newSet
    })
  }

  const panelistMenuGroups: MenuGroup[] = [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: Home }
      ]
    },
    {
      title: "Earn",
      items: [
        { label: "Surveys", href: "/surveys", icon: ClipboardList },
        { label: "Live Surveys", href: "/surveys/live", icon: PlayCircle },
        { label: "Panels", href: "/panels", icon: Users2 }
      ],
      collapsible: true
    },
    {
      title: "Redeem",
      items: [
        { label: "Rewards", href: "/offers", icon: Gift },
        { label: "Redemptions", href: "/redemptions", icon: ShoppingCart }
      ]
    },
    {
      title: "Account",
      items: [
        { label: "Profile", href: "/profile", icon: User },
        { label: "Activity", href: "/activity", icon: Activity },
        { label: "Settings", href: "/settings", icon: Settings }
      ]
    }
  ]

  const adminMenuGroups: MenuGroup[] = [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/admin/dashboard", icon: Home }
      ]
    },
    {
      title: "Management",
      items: [
        { label: "Panelists", href: "/admin/panelists", icon: Users },
        { label: "Surveys", href: "/admin/surveys", icon: ClipboardList },
        { label: "Live Surveys", href: "/admin/surveys/live", icon: PlayCircle },
        { label: "Panels", href: "/admin/panels", icon: Users2 }
      ],
      collapsible: true
    },
    {
      title: "Rewards",
      items: [
        { label: "Offers", href: "/admin/offers", icon: Gift },
        { label: "Redemptions", href: "/admin/redemptions", icon: ShoppingCart },
        { label: "Analytics", href: "/admin/analytics", icon: BarChart3 }
      ]
    },
    {
      title: "System",
      items: [
        { label: "Settings", href: "/admin/settings", icon: Settings2 },
        { label: "Logs", href: "/admin/logs", icon: Activity }
      ]
    }
  ]

  const menuGroups = role === "panelist" ? panelistMenuGroups : adminMenuGroups

  if (!user) return null

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "fixed left-0 top-0 z-40 h-full bg-background border-r border-border transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-16",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {isExpanded && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Rewards</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8 p-0"
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 space-y-2">
          {menuGroups.map((group, groupIndex) => (
            <div key={group.title} className="space-y-1">
              {groupIndex > 0 && <Separator className="my-2" />}
              
              {/* Group Header */}
              {isExpanded && group.collapsible && (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="flex items-center justify-between w-full px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{group.title}</span>
                  <ChevronRight 
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedGroups.has(group.title) && "rotate-90"
                    )} 
                  />
                </button>
              )}

              {/* Menu Items */}
              <div className={cn(
                "space-y-1",
                group.collapsible && !expandedGroups.has(group.title) && "hidden"
              )}>
                {group.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Button
                      key={item.href}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-9 px-3",
                        isActive && "bg-secondary text-secondary-foreground"
                      )}
                      onClick={() => router.push(item.href)}
                    >
                      <item.icon className={cn(
                        "h-4 w-4",
                        isExpanded ? "mr-3" : "mx-auto"
                      )} />
                      {isExpanded && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {item.badge && isExpanded && (
                        <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start h-9 px-3 text-muted-foreground hover:text-foreground"
          onClick={() => {
            // Handle sign out
            console.log("Sign out clicked")
          }}
        >
          <LogOut className={cn(
            "h-4 w-4",
            isExpanded ? "mr-3" : "mx-auto"
          )} />
          {isExpanded && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  )
} 