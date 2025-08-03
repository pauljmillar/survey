// Client-side auth utilities (no server-only imports)
export type UserRole = 'panelist' | 'survey_admin' | 'system_admin'

// Permission matrix as defined in TDD
export const PERMISSIONS = {
  // Panelist permissions
  'view_own_profile': ['panelist', 'survey_admin', 'system_admin'],
  'complete_surveys': ['panelist'],
  'redeem_points': ['panelist'],
  'view_own_activity': ['panelist', 'survey_admin', 'system_admin'],
  
  // Survey Admin permissions
  'create_surveys': ['survey_admin', 'system_admin'],
  'manage_qualifications': ['survey_admin', 'system_admin'],
  'view_survey_analytics': ['survey_admin', 'system_admin'],
  
  // System Admin permissions
  'view_all_users': ['system_admin'],
  'manage_offers': ['system_admin'],
  'manage_user_accounts': ['system_admin'],
  'view_platform_analytics': ['system_admin'],
} as const

export type Permission = keyof typeof PERMISSIONS

/**
 * Check if user has a specific permission (client-side)
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(userRole)
}

/**
 * Check if user has any of the provided permissions (client-side)
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * Check if user has all of the provided permissions (client-side)
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * Role hierarchy for authorization checks (client-side)
 */
export const ROLE_HIERARCHY = {
  'panelist': 1,
  'survey_admin': 2,
  'system_admin': 3,
} as const

/**
 * Check if user role has higher or equal authority than required role (client-side)
 */
export function hasRoleAuthority(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
} 