# Authentication and Authorization System

This directory contains the authentication and authorization implementation for the Panelist Rewards Platform using Clerk.dev and role-based access control.

## Overview

The system implements a three-role architecture:
- **Panelist**: Can complete surveys and redeem points
- **Survey Admin**: Can create and manage surveys
- **System Admin**: Has full platform access

## Components

### Core Authentication (`lib/auth.ts`)
- `getCurrentUserWithRole()` - Get authenticated user with database role
- `hasPermission()` - Check specific permissions
- `requireAuth()` - Server-side auth requirement
- Permission matrix matching TDD specifications

### Route Protection (`components/auth/auth-guard.tsx`)
- `AuthGuard` - Generic route protection component
- `PanelistGuard`, `SurveyAdminGuard`, `SystemAdminGuard` - Role-specific guards
- Handles loading states and unauthorized access

### Custom Hooks (`hooks/use-auth.ts`)
- `useAuth()` - Main auth hook with role and permissions
- `usePanelistAuth()` - Panelist-specific auth state
- `useSurveyAdminAuth()` - Survey admin auth state
- `useSystemAdminAuth()` - System admin auth state

## API Routes

### `/api/auth/user-role`
- **GET**: Fetch current user's role from database
- **PUT**: Update user role (system admin only)

### `/api/auth/panelist-profile`
- **GET**: Fetch panelist profile data
- **POST**: Create new panelist profile
- **PUT**: Update panelist profile data

## Usage Examples

### Route Protection
```tsx
import { AuthGuard, SurveyAdminGuard } from '@/components/auth/auth-guard'

// Generic permission-based protection
<AuthGuard requiredPermission="create_surveys">
  <SurveyCreator />
</AuthGuard>

// Role-based protection
<SurveyAdminGuard>
  <SurveyManagement />
</SurveyAdminGuard>

// Multiple permissions (any)
<AuthGuard requiredPermissions={['view_analytics', 'create_surveys']}>
  <Dashboard />
</AuthGuard>
```

### Using Auth Hooks
```tsx
import { useAuth, usePanelistAuth } from '@/hooks/use-auth'

function Component() {
  const { userRole, hasPermission } = useAuth()
  const { isPanelist, canRedeemPoints } = usePanelistAuth()
  
  if (hasPermission('create_surveys')) {
    return <SurveyCreator />
  }
  
  return null
}
```

### Server-Side Auth
```tsx
import { requireAuth } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await requireAuth('create_surveys')
  // User is authenticated and has permission
}
```

## Permission Matrix

| Permission | Panelist | Survey Admin | System Admin |
|------------|----------|--------------|--------------|
| view_own_profile | ✅ | ✅ | ✅ |
| complete_surveys | ✅ | ❌ | ❌ |
| redeem_points | ✅ | ❌ | ❌ |
| create_surveys | ❌ | ✅ | ✅ |
| manage_qualifications | ❌ | ✅ | ✅ |
| view_all_users | ❌ | ❌ | ✅ |
| manage_offers | ❌ | ❌ | ✅ |

## Role Hierarchy

1. **Panelist** (Level 1) - Basic user, can participate in surveys
2. **Survey Admin** (Level 2) - Can manage surveys and qualifications
3. **System Admin** (Level 3) - Full platform access

Higher-level roles inherit lower-level permissions where appropriate.

## Integration with Database

The system integrates with the database schema:
- User roles stored in `users.role` column
- Panelist profiles in `panelist_profiles` table
- Activity logging through database functions

## Security Features

- Row Level Security (RLS) policies in database
- Server-side permission validation
- Automatic user creation on first login
- Session management through Clerk
- Route-level and component-level protection

## Environment Variables

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database (for role management)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install @clerk/nextjs @supabase/supabase-js
   ```

2. **Configure Clerk**
   - Create Clerk application at clerk.dev
   - Add environment variables
   - Configure sign-in/sign-up URLs

3. **Database Setup**
   - Ensure users table exists with role column
   - Apply RLS policies from schema

4. **Middleware Setup**
   - Add middleware.ts to project root
   - Configure protected routes

## Testing

- Test role-based access control
- Verify permission checking functions
- Test API route authorization
- Validate middleware route protection
- Test user role creation and updates

## Troubleshooting

### Common Issues

1. **"User not found in database"**
   - User creation failed on first login
   - Check Supabase service role key

2. **"Permission denied" errors**
   - Verify user role in database
   - Check permission matrix configuration

3. **Infinite loading states**
   - Check API route responses
   - Verify Clerk configuration

4. **RLS policy errors**
   - Ensure auth.uid() is properly set
   - Check database policy definitions 