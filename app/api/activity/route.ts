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

    // Determine which user's activity to fetch
    const targetUserId = userId && userData?.role === 'system_admin' ? userId : user.id

    // Fetch point ledger entries
    let pointLedgerQuery = supabase
      .from('point_ledger')
      .select(`
        id,
        points,
        transaction_type,
        title,
        description,
        metadata,
        created_at,
        balance_after
      `)
      .eq('panelist_id', targetUserId)
      .order('created_at', { ascending: false })

    // Apply transaction type filter if specified
    if (activityType && ['redemption', 'bonus', 'survey_completion', 'manual_award', 'account_signup_bonus', 'app_download_bonus', 'mail_package_scan', 'mail_package_review'].includes(activityType)) {
      pointLedgerQuery = pointLedgerQuery.eq('transaction_type', activityType)
    }

    const { data: pointActivities, error: pointError } = await pointLedgerQuery

    if (pointError) {
      console.error('Error fetching point ledger:', pointError)
      return NextResponse.json({ error: 'Failed to fetch point activities' }, { status: 500 })
    }

    // Fetch activity log entries (non-point activities)
    let activityLogQuery = supabase
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
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    // Apply activity type filter if specified (for non-point activities)
    if (activityType && !['redemption', 'bonus', 'survey_completion', 'manual_award', 'account_signup_bonus', 'app_download_bonus', 'mail_package_scan', 'mail_package_review'].includes(activityType)) {
      activityLogQuery = activityLogQuery.eq('activity_type', activityType)
    }

    const { data: logActivities, error: logError } = await activityLogQuery

    if (logError) {
      console.error('Error fetching activity log:', logError)
      return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 })
    }

    // Transform point ledger entries to match activity format
    const transformedPointActivities = pointActivities?.map(entry => ({
      id: `point_${entry.id}`,
      activity_type: 'point_transaction',
      description: entry.title,
      metadata: {
        ...entry.metadata,
        points: entry.points,
        transaction_type: entry.transaction_type,
        balance_after: entry.balance_after,
        description: entry.description
      },
      created_at: entry.created_at,
      points: entry.points,
      transaction_type: entry.transaction_type
    })) || []

    // Transform activity log entries
    const transformedLogActivities = logActivities?.map(activity => ({
      id: `log_${activity.id}`,
      activity_type: activity.activity_type,
      description: activity.description,
      metadata: activity.metadata,
      created_at: activity.created_at,
      user_email: userData?.role === 'system_admin' ? activity.users?.[0]?.email : undefined,
      user_role: userData?.role === 'system_admin' ? activity.users?.[0]?.role : undefined,
    })) || []

    // Combine and sort all activities
    const allActivities = [...transformedPointActivities, ...transformedLogActivities]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply pagination
    const paginatedActivities = allActivities.slice(offset, offset + limit)

    return NextResponse.json({ 
      activities: paginatedActivities, 
      total: allActivities.length 
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in activity log API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 