"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton, useUser, useClerk } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Menu, X, Settings, LogOut, User, Sun, Moon } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

const MENU_OPTIONS: { label: string; href: string }[] = [
  { label: "Earn", href: "/surveys" },
  { label: "Redeem", href: "/offers" },
  { label: "How it Works", href: "/how-it-works" },
]

export function TopNavBar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { theme, setTheme } = useTheme()
  const { userRole } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      setProfileDropdownOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleThemeToggle = () => {
    setTheme(theme === "light" ? "dark" : "light")
    setProfileDropdownOpen(false)
  }

  const handleAccountSettings = () => {
    setAccountModalOpen(true)
    setProfileDropdownOpen(false)
  }

  return (
    <nav aria-label="Main navigation" className="w-full border-b border-black/10 bg-white dark:bg-black/90 dark:border-white/10 fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="font-bold text-xl tracking-tight text-black dark:text-white" aria-label="Home">
          SurveyApp
        </Link>

        {/* Desktop Menu - Only show for non-signed in users */}
        <SignedOut>
          <div className="hidden md:flex items-center gap-6" role="menubar" aria-label="Main menu">
            {MENU_OPTIONS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium px-3 py-2 rounded-md transition-colors duration-150 ${
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
        </SignedOut>

        {/* Right Side: Auth/Profile */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher (when signed out) */}
          <SignedOut>
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-150"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 text-black dark:text-white" />
              ) : (
                <Sun className="w-5 h-5 text-black dark:text-white" />
              )}
            </button>
          </SignedOut>

          {/* Auth Buttons (when signed out) */}
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="default" size="sm" className="ml-1 bg-black text-white dark:bg-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>

          {/* Profile Dropdown (when signed in) */}
          <SignedIn>
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-150"
                aria-label="Profile menu"
                aria-expanded={profileDropdownOpen}
              >
                <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-black dark:text-white" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-black dark:text-white">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </span>
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={handleAccountSettings}
                      className="flex items-center w-full px-4 py-2 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Account settings
                    </button>
                    <button
                      onClick={handleThemeToggle}
                      className="flex items-center w-full px-4 py-2 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      {theme === "light" ? (
                        <Moon className="w-4 h-4 mr-3" />
                      ) : (
                        <Sun className="w-4 h-4 mr-3" />
                      )}
                      Toggle theme
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SignedIn>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors duration-150"
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
            {/* Mobile Menu Items - Only show for non-signed in users */}
            <SignedOut>
              {MENU_OPTIONS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-lg font-medium px-4 py-3 rounded-md transition-colors duration-150 ${
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
            </SignedOut>

            {/* Mobile Auth Section */}
            <div className="border-t border-black/10 dark:border-white/10 pt-4 mt-4">
              <SignedOut>
                <div className="flex flex-col gap-3">
                  <SignInButton mode="modal">
                    <Button variant="ghost" size="lg" className="w-full text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10">
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button variant="default" size="lg" className="w-full bg-black text-white dark:bg-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80">
                      Sign Up
                    </Button>
                  </SignUpButton>
                </div>
              </SignedOut>
              
              <SignedIn>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-black/5 dark:bg-white/10 rounded-md">
                    <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-black dark:text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black dark:text-white">
                        {user?.firstName || 'User'}
                      </p>
                      <p className="text-xs text-black/60 dark:text-white/60">
                        {user?.emailAddresses[0]?.emailAddress}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <button
                      onClick={handleAccountSettings}
                      className="flex items-center w-full px-4 py-3 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-md"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Account settings
                    </button>
                    <button
                      onClick={handleThemeToggle}
                      className="flex items-center w-full px-4 py-3 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-md"
                    >
                      {theme === "light" ? (
                        <Moon className="w-4 h-4 mr-3" />
                      ) : (
                        <Sun className="w-4 h-4 mr-3" />
                      )}
                      Toggle theme
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {profileDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setProfileDropdownOpen(false)}
        />
      )}

      {/* Account Settings Modal */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => setAccountModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-black dark:text-white">
                  Account Settings
                </h2>
                <button
                  onClick={() => setAccountModalOpen(false)}
                  className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.firstName || ''}
                    className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md bg-white dark:bg-black text-black dark:text-white"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue={user?.emailAddresses[0]?.emailAddress || ''}
                    className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md bg-white dark:bg-black text-black dark:text-white"
                    placeholder="Enter your email"
                    disabled
                  />
                  <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {/* Profile Edit Link for Panelists */}
                {userRole === 'panelist' && (
                  <div className="pt-4 border-t border-black/10 dark:border-white/10">
                    <Link
                      href="/profile/edit"
                      onClick={() => setAccountModalOpen(false)}
                      className="flex items-center w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                    >
                      <User className="w-4 h-4 mr-3" />
                      Edit Profile & Demographics
                    </Link>
                    <p className="text-xs text-black/60 dark:text-white/60 mt-1 ml-7">
                      Update your survey preferences and demographic information
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={() => setAccountModalOpen(false)}
                    className="px-4 py-2 text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Handle save functionality here
                      setAccountModalOpen(false)
                    }}
                    className="px-4 py-2 text-sm bg-black text-white dark:bg-white dark:text-black rounded-md hover:bg-black/80 dark:hover:bg-white/80"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
} 