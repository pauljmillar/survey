'use client'

import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { UserRole, Permission, hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/auth'

interface UseAuthReturn {
  // Clerk auth state
  isLoaded: boolean
  isSignedIn: boolean | undefined
  user: any
  
  // Our extended auth state
  userRole: UserRole | null
  loading: boolean
  error: string | null
  
  // Permission checking functions
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  hasRole: (role: UserRole) => boolean
  hasRoleOrHigher: (role: UserRole) => boolean
  
  // User profile data
  panelistProfile: any | null
  
  // Utility functions
  refreshUserRole: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const { isLoaded, isSignedIn, userId } = useClerkAuth()
  const { user } = useUser()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [panelistProfile, setPanelistProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserRole = async () => {
    if (!isSignedIn || !userId) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const response = await fetch('/api/auth/user-role')
      
      if (!response.ok) {
        throw new Error('Failed to fetch user role')
      }

      const data = await response.json()
      setUserRole(data.role)

      // If user is a panelist, fetch their profile
      if (data.role === 'panelist') {
        const profileResponse = await fetch('/api/auth/panelist-profile')
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setPanelistProfile(profileData)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching user role:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded) {
      fetchUserRole()
    }
  }, [isLoaded, isSignedIn, userId])

  // Permission checking functions
  const checkPermission = (permission: Permission): boolean => {
    return userRole ? hasPermission(userRole, permission) : false
  }

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    return userRole ? hasAnyPermission(userRole, permissions) : false
  }

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    return userRole ? hasAllPermissions(userRole, permissions) : false
  }

  const checkRole = (role: UserRole): boolean => {
    return userRole === role
  }

  const checkRoleOrHigher = (role: UserRole): boolean => {
    if (!userRole) return false
    
    const roleHierarchy = { 'panelist': 1, 'survey_admin': 2, 'system_admin': 3 }
    return roleHierarchy[userRole] >= roleHierarchy[role]
  }

  return {
    // Clerk auth state
    isLoaded,
    isSignedIn,
    user,
    
    // Our extended auth state
    userRole,
    loading,
    error,
    
    // Permission checking functions
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    hasRole: checkRole,
    hasRoleOrHigher: checkRoleOrHigher,
    
    // User profile data
    panelistProfile,
    
    // Utility functions
    refreshUserRole: fetchUserRole,
  }
}

// Convenience hooks for specific roles
export function usePanelistAuth() {
  const auth = useAuth()
  return {
    ...auth,
    isPanelist: auth.hasRole('panelist'),
    canCompleteSurveys: auth.hasPermission('complete_surveys'),
    canRedeemPoints: auth.hasPermission('redeem_points'),
  }
}

export function useSurveyAdminAuth() {
  const auth = useAuth()
  return {
    ...auth,
    isSurveyAdmin: auth.hasRoleOrHigher('survey_admin'),
    canCreateSurveys: auth.hasPermission('create_surveys'),
    canManageQualifications: auth.hasPermission('manage_qualifications'),
    canViewAnalytics: auth.hasPermission('view_survey_analytics'),
  }
}

export function useSystemAdminAuth() {
  const auth = useAuth()
  return {
    ...auth,
    isSystemAdmin: auth.hasRole('system_admin'),
    canViewAllUsers: auth.hasPermission('view_all_users'),
    canManageOffers: auth.hasPermission('manage_offers'),
    canManageUsers: auth.hasPermission('manage_user_accounts'),
    canViewPlatformAnalytics: auth.hasPermission('view_platform_analytics'),
  }
} 