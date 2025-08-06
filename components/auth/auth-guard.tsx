'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRole, Permission, hasPermission, hasAnyPermission } from '@/lib/auth-client'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredPermission?: Permission
  requiredPermissions?: Permission[]
  requireAll?: boolean // If true, user must have ALL permissions. If false, user needs ANY permission
  fallbackUrl?: string
  loadingComponent?: React.ReactNode
  unauthorizedComponent?: React.ReactNode
}

export function AuthGuard({
  children,
  requiredRole,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallbackUrl = '/sign-in',
  loadingComponent,
  unauthorizedComponent,
}: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserRole() {
      if (!isLoaded || !isSignedIn || !user) {
        setLoading(false)
        return
      }

      try {
        // Fetch user role from our database
        const response = await fetch('/api/auth/user-role')
        if (response.ok) {
          const data = await response.json()
          setUserRole(data.role)
        } else {
          console.error('Failed to fetch user role')
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [isLoaded, isSignedIn, user])

  // Show loading state
  if (!isLoaded || loading) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    router.push(fallbackUrl)
    return null
  }

  // If we don&apos;t have user role yet, show loading
  if (!userRole) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Check role-based access
  if (requiredRole) {
    const roleHierarchy = { 'panelist': 1, 'survey_admin': 2, 'system_admin': 3 }
    if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
      return unauthorizedComponent || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      )
    }
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
    return unauthorizedComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    )
  }

  // Check multiple permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? requiredPermissions.every(permission => hasPermission(userRole, permission))
      : hasAnyPermission(userRole, requiredPermissions)

    if (!hasAccess) {
      return unauthorizedComponent || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

// Convenience components for common access patterns
export function PanelistGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredRole'>) {
  return (
    <AuthGuard requiredRole="panelist" {...props}>
      {children}
    </AuthGuard>
  )
}

export function SurveyAdminGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredRole'>) {
  return (
    <AuthGuard requiredRole="survey_admin" {...props}>
      {children}
    </AuthGuard>
  )
}

export function SystemAdminGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredRole'>) {
  return (
    <AuthGuard requiredRole="system_admin" {...props}>
      {children}
    </AuthGuard>
  )
} 