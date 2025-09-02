import { auth, currentUser } from '@clerk/nextjs/server'
import { Database } from '@/types/database.types'
import { createClient } from '@supabase/supabase-js'

// Types from database schema
export type UserRole = Database['public']['Enums']['user_role']

// Permission matrix as defined in TDD
export const PERMISSIONS = {
  // Panelist permissions
  'view_own_profile': ['panelist', 'survey_admin', 'system_admin'] as UserRole[],
  'complete_surveys': ['panelist'] as UserRole[],
  'read_survey_questions': ['panelist', 'survey_admin', 'system_admin'] as UserRole[],
  'redeem_points': ['panelist'] as UserRole[],
  'view_own_activity': ['panelist', 'survey_admin', 'system_admin'] as UserRole[],
  'create_mail_packages': ['panelist'] as UserRole[],
  'update_mail_packages': ['panelist'] as UserRole[],
  'upload_mail_scans': ['panelist'] as UserRole[],
  
  // Survey Admin permissions
  'create_surveys': ['survey_admin', 'system_admin'] as UserRole[],
  'manage_qualifications': ['survey_admin', 'system_admin'] as UserRole[],
  'view_survey_analytics': ['survey_admin', 'system_admin'] as UserRole[],
  'manage_panelists': ['survey_admin', 'system_admin'] as UserRole[],
  
  // System Admin permissions
  'view_all_users': ['system_admin'] as UserRole[],
  'manage_offers': ['system_admin', 'survey_admin'] as UserRole[],
  'manage_user_accounts': ['system_admin'] as UserRole[],
  'view_platform_analytics': ['system_admin'] as UserRole[],
  'manage_programs': ['system_admin', 'survey_admin'] as UserRole[],
} as const

export type Permission = keyof typeof PERMISSIONS

// Initialize Supabase client for user role management
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Get the current authenticated user with role information
 */
export async function getCurrentUserWithRole() {
  try {
    const { userId } = await auth()
    if (!userId) return null

    const user = await currentUser()
    if (!user) return null

    // Get user role from database
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !dbUser) {
      // User might not exist in database yet, create with default role
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: user.emailAddresses[0]?.emailAddress || '',
          role: 'panelist'
        })
        .select('role')
        .single()

      if (createError) {
        console.error('Error creating user in database:', createError)
        return null
      }

      return {
        ...user,
        role: newUser.role
      }
    }

    return {
      ...user,
      role: dbUser.role
    }
  } catch (error) {
    console.error('Error getting current user with role:', error)
    return null
  }
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return PERMISSIONS[permission].includes(userRole)
}

/**
 * Check if user has any of the provided permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * Check if user has all of the provided permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * Get user's panelist profile if they are a panelist
 */
export async function getUserPanelistProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('panelist_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) return null
    return data
  } catch (error) {
    console.error('Error getting panelist profile:', error)
    return null
  }
}

/**
 * Create a panelist profile for a new user
 */
export async function createPanelistProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('panelist_profiles')
      .insert({
        user_id: userId,
        points_balance: 0,
        total_points_earned: 0,
        total_points_redeemed: 0,
        profile_data: {},
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating panelist profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating panelist profile:', error)
    return null
  }
}

/**
 * Update user role in database
 */
export async function updateUserRole(userId: string, newRole: UserRole) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user role:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating user role:', error)
    return false
  }
}

/**
 * Require authentication and specific permission
 */
export async function requireAuth(requiredPermission?: Permission) {
  const userWithRole = await getCurrentUserWithRole()
  
  if (!userWithRole) {
    throw new Error('Authentication required')
  }

  if (requiredPermission && !hasPermission(userWithRole.role, requiredPermission)) {
    throw new Error('Insufficient permissions')
  }

  return userWithRole
}

/**
 * Role hierarchy for authorization checks
 */
export const ROLE_HIERARCHY = {
  'panelist': 1,
  'survey_admin': 2,
  'system_admin': 3,
} as const

/**
 * Check if user role has higher or equal authority than required role
 */
export function hasRoleAuthority(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
} 