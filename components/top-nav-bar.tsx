"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ColorModeSwitcher } from "@/components/color-mode-switcher"
import { Menu, X } from "lucide-react"

const MENU_OPTIONS = [
  { label: "About", href: "/about" },
  { label: "Earn Points", href: "/surveys" },
  { label: "Redeem Points", href: "/offers" },
]

export function TopNavBar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav aria-label="Main navigation" className="w-full border-b border-black/10 bg-white dark:bg-black/90 dark:border-white/10 fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="font-bold text-xl tracking-tight text-black dark:text-white" aria-label="Home">
          SurveyApp
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6" role="menubar" aria-label="Main menu">
          {MENU_OPTIONS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium px-2 py-1 rounded transition-colors duration-150 ${
                pathname === item.href
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-black/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
              role="menuitem"
              tabIndex={0}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Side: Auth/Profile/Theme */}
        <div className="flex items-center gap-2">
          <ColorModeSwitcher />
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="text-black dark:text-white">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="default" size="sm" className="ml-1">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 border border-black/10 dark:border-white/10",
                  userButtonPopoverCard: "bg-white dark:bg-black border border-black/10 dark:border-white/10",
                },
              }}
              aria-label="Profile menu"
            />
          </SignedIn>
          {/* Mobile menu button */}
          <button
            className="md:hidden ml-2 p-2 rounded focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-white/95 dark:bg-black/95 border-t border-black/10 dark:border-white/10 animate-in slide-in-from-top-10" aria-label="Mobile menu">
          <div className="flex flex-col gap-4 p-6">
            {MENU_OPTIONS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-lg font-medium px-2 py-2 rounded transition-colors duration-150 ${
                  pathname === item.href
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
                role="menuitem"
                tabIndex={0}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 mt-4">
              <ColorModeSwitcher />
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm" className="text-black dark:text-white">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="default" size="sm" className="ml-1">
                    Sign Up
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 border border-black/10 dark:border-white/10",
                      userButtonPopoverCard: "bg-white dark:bg-black border border-black/10 dark:border-white/10",
                    },
                  }}
                  aria-label="Profile menu"
                />
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
} 