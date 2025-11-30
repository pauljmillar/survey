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
    const { searchParams } = new URL(request.url)
    const { contestId } = await params

    const limit = parseInt(searchParams.get('limit') || '50')
    const actualLimit = Math.min(limit, 100) // Max 100

    // Get panelist profile
    const panelistProfile = await getUserPanelistProfile(user.id)
    if (!panelistProfile) {
      return NextResponse.json({ error: 'Panelist profile not found' }, { status: 404 })
    }

    // Get contest details
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('status, invite_type')
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

    // Get leaderboard with panelist info
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('contest_participants')
      .select(`
        rank,
        points_earned,
        joined_at,
        panelist:panelist_profiles!inner(
          id,
          user_id
        )
      `)
      .eq('contest_id', contestId)
      .order('rank', { ascending: true })
      .limit(actualLimit)

    if (leaderboardError) {
      console.error('Error fetching leaderboard:', leaderboardError)
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    // Fetch user emails separately and merge
    // Note: panelist is returned as an array by Supabase even for one-to-one relationships
    const userIds = leaderboard?.map(entry => {
      const panelist = Array.isArray(entry.panelist) ? entry.panelist[0] : entry.panelist
      return panelist?.user_id
    }).filter(Boolean) as string[] || []
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
    const transformedLeaderboard = leaderboard?.map(entry => {
      const panelist = Array.isArray(entry.panelist) ? entry.panelist[0] : entry.panelist
      return {
        ...entry,
        panelist: {
          ...panelist,
          users: panelist?.user_id ? [{ email: userEmailsMap[panelist.user_id] || 'Unknown' }] : []
        }
      }
    }) || []

    // Get total participant count
    const { count: totalParticipants } = await supabase
      .from('contest_participants')
      .select('*', { count: 'exact', head: true })
      .eq('contest_id', contestId)

    // Get current user's rank if they've joined
    const { data: userParticipation } = await supabase
      .from('contest_participants')
      .select('rank, points_earned')
      .eq('contest_id', contestId)
      .eq('panelist_id', panelistProfile.id)
      .single()

    return NextResponse.json({
      leaderboard: transformedLeaderboard,
      total_participants: totalParticipants || 0,
      user_rank: userParticipation?.rank || null,
      user_points: userParticipation?.points_earned || null,
      contest_status: contest.status
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('Error in leaderboard GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

