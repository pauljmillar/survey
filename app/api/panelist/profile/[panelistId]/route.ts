import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ panelistId: string }> }
) {
  try {
    const user = await requireAuth('view_own_profile')
    const { panelistId } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(panelistId)) {
      return NextResponse.json({ error: 'Invalid panelist ID format' }, { status: 400 })
    }

    // Get panelist profile by UUID
    const { data: profile, error } = await supabase
      .from('panelist_profiles')
      .select(`
        id,
        user_id,
        points_balance,
        total_points_earned,
        total_points_redeemed,
        surveys_completed,
        is_active,
        profile_data,
        created_at,
        updated_at
      `)
      .eq('id', panelistId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Panelist profile not found' }, { status: 404 })
      }
      console.error('Error fetching panelist profile by ID:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // Check if the requesting user has permission to view this profile
    // Users can only view their own profile, admins can view any profile
    if (profile.user_id !== user.id) {
      // Check if user is an admin
      const { data: userRole } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!userRole || !['survey_admin', 'system_admin'].includes(userRole.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    return NextResponse.json(profile)
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in panelist profile by ID API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
