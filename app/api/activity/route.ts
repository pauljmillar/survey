import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth('view_own_activity')
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const activityType = searchParams.get('type')
    const userId = searchParams.get('user_id')

    // Get user role for permission checking
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // Build base query
    let query = supabase
      .from('activity_log')
      .select(`
        id,
        activity_type,
        description,
        metadata,
        created_at,
        users (
          email,
          role
        )
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    // Apply filters based on user role and permissions
    if (userId && userData?.role === 'system_admin') {
      // System admins can view any user's activity
      query = query.eq('user_id', userId)
    } else {
      // Regular users can only see their own activity
      query = query.eq('user_id', user.id)
    }

    if (activityType) {
      query = query.eq('activity_type', activityType)
    }

    const { data: activities, error } = await query

    if (error) {
      console.error('Error fetching activity log:', error)
      return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 })
    }

    // Clean up response to remove sensitive user data for non-admin users
    const cleanActivities = activities?.map(activity => ({
      id: activity.id,
      activity_type: activity.activity_type,
      description: activity.description,
      metadata: activity.metadata,
      created_at: activity.created_at,
      user_email: userData?.role === 'system_admin' ? activity.users?.[0]?.email : undefined,
      user_role: userData?.role === 'system_admin' ? activity.users?.[0]?.role : undefined,
    })) || []

    return NextResponse.json({ 
      activities: cleanActivities, 
      total: cleanActivities.length 
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in activity log API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 