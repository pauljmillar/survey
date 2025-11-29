import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth, getUserPanelistProfile } from '@/lib/auth'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contestId: string }> }
) {
  try {
    const user = await requireAuth('view_own_profile')
    const { contestId } = await params

    // Get panelist profile
    const panelistProfile = await getUserPanelistProfile(user.id)
    if (!panelistProfile) {
      return NextResponse.json({ error: 'Panelist profile not found' }, { status: 404 })
    }

    // Get contest details
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single()

    if (contestError || !contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    }

    // Check if panelist has access
    let hasAccess = false
    if (contest.invite_type === 'all_panelists') {
      hasAccess = true
    } else {
      const { data: invitation } = await supabase
        .from('contest_invitations')
        .select('id')
        .eq('contest_id', contestId)
        .eq('panelist_id', panelistProfile.id)
        .single()

      hasAccess = !!invitation
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if panelist has joined
    const { data: participation } = await supabase
      .from('contest_participants')
      .select('*')
      .eq('contest_id', contestId)
      .eq('panelist_id', panelistProfile.id)
      .single()

    // Update leaderboard for active contests to ensure points are current
    if (contest.status === 'active') {
      const { error: updateError } = await supabase.rpc('update_contest_leaderboard', {
        p_contest_id: contestId
      })
      if (updateError) {
        console.error('Error updating leaderboard:', updateError)
        // Continue anyway - we'll show stale data rather than failing
      }
    }

    // Get leaderboard (top 10)
    const { data: leaderboard } = await supabase
      .from('contest_participants')
      .select(`
        rank,
        points_earned,
        panelist:panelist_profiles!inner(
          id,
          user_id
        )
      `)
      .eq('contest_id', contestId)
      .order('rank', { ascending: true, nullsLast: true })
      .limit(10)

    // Fetch user emails separately and merge
    const userIds = leaderboard?.map(entry => entry.panelist?.user_id).filter(Boolean) || []
    const userEmailsMap: Record<string, string> = {}
    
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds)
      
      if (!usersError && users) {
        users.forEach(user => {
          userEmailsMap[user.id] = user.email
        })
      }
    }

    // Transform leaderboard to include user emails in expected format
    const transformedLeaderboard = leaderboard?.map(entry => ({
      ...entry,
      panelist: {
        ...entry.panelist,
        users: entry.panelist?.user_id ? [{ email: userEmailsMap[entry.panelist.user_id] || 'Unknown' }] : []
      }
    })) || []

    return NextResponse.json({
      contest,
      has_joined: !!participation,
      participation: participation || null,
      leaderboard: transformedLeaderboard
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('Error in contest GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

