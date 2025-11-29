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
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') || 'active'
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get panelist profile
    const panelistProfile = await getUserPanelistProfile(user.id)
    if (!panelistProfile) {
      return NextResponse.json({ error: 'Panelist profile not found' }, { status: 404 })
    }

    // Build query for contests
    let query = supabase
      .from('contests')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter by status
    if (status === 'active') {
      query = query.eq('status', 'active')
    } else if (status === 'ended') {
      query = query.eq('status', 'ended')
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: contests, error: contestsError } = await query

    if (contestsError) {
      console.error('Error fetching contests:', contestsError)
      return NextResponse.json({ error: 'Failed to fetch contests' }, { status: 500 })
    }

    // Filter contests based on invitation
    const availableContests = []
    for (const contest of contests || []) {
      // If invite_type is 'all_panelists', include it
      if (contest.invite_type === 'all_panelists') {
        availableContests.push(contest)
      } else {
        // Check if panelist is invited
        const { data: invitation } = await supabase
          .from('contest_invitations')
          .select('id')
          .eq('contest_id', contest.id)
          .eq('panelist_id', panelistProfile.id)
          .single()

        if (invitation) {
          availableContests.push(contest)
        }
      }
    }

    // Check which contests the panelist has joined
    const contestIds = availableContests.map(c => c.id)
    const { data: participations } = await supabase
      .from('contest_participants')
      .select('contest_id')
      .eq('panelist_id', panelistProfile.id)
      .in('contest_id', contestIds)

    const joinedContestIds = new Set(participations?.map(p => p.contest_id) || [])

    // Add joined status to each contest
    const contestsWithStatus = availableContests.map(contest => ({
      ...contest,
      has_joined: joinedContestIds.has(contest.id)
    }))

    return NextResponse.json({
      contests: contestsWithStatus,
      limit,
      offset,
      hasMore: (contests?.length || 0) === limit
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('Error in contests GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

