import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth, getUserPanelistProfile } from '@/lib/auth'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth('view_own_profile')

    // Get panelist profile
    const panelistProfile = await getUserPanelistProfile(user.id)
    if (!panelistProfile) {
      return NextResponse.json({ error: 'Panelist profile not found' }, { status: 404 })
    }

    // Get active contests the panelist has joined
    const { data: participations, error: participationsError } = await supabase
      .from('contest_participants')
      .select(`
        contest_id,
        rank,
        points_earned,
        contests!inner(
          id,
          title,
          description,
          start_date,
          end_date,
          prize_points,
          status
        )
      `)
      .eq('panelist_id', panelistProfile.id)
      .eq('contests.status', 'active')

    if (participationsError) {
      console.error('Error fetching participations:', participationsError)
      return NextResponse.json({ error: 'Failed to fetch contests' }, { status: 500 })
    }

    if (!participations || participations.length === 0) {
      return NextResponse.json({ contests: [] })
    }

    // Process each contest
    const contestsWithLeaderboards = await Promise.all(
      participations.map(async (participation) => {
        const contest = Array.isArray(participation.contests) ? participation.contests[0] : participation.contests
        const contestId = contest.id

        // Update leaderboard for active contests to ensure points are current
        const { error: updateError } = await supabase.rpc('update_contest_leaderboard', {
          p_contest_id: contestId
        })
        if (updateError) {
          console.error('Error updating leaderboard:', updateError)
          // Continue anyway - we'll show stale data rather than failing
        }

        // Get top 5-10 leaderboard entries
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
          .order('rank', { ascending: true })
          .limit(5)

        // Fetch user emails separately and merge
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

        // Transform leaderboard to include user emails
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

        // Get user's current participation data (refresh after leaderboard update)
        const { data: userParticipation } = await supabase
          .from('contest_participants')
          .select('rank, points_earned')
          .eq('contest_id', contestId)
          .eq('panelist_id', panelistProfile.id)
          .single()

        return {
          id: contest.id,
          title: contest.title,
          description: contest.description,
          start_date: contest.start_date,
          end_date: contest.end_date,
          prize_points: contest.prize_points,
          user_rank: userParticipation?.rank || null,
          user_points: userParticipation?.points_earned || 0,
          total_participants: totalParticipants || 0,
          leaderboard: transformedLeaderboard
        }
      })
    )

    return NextResponse.json({ contests: contestsWithLeaderboards })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('Error in my-active contests GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

