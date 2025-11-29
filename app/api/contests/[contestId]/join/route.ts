import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth, getUserPanelistProfile } from '@/lib/auth'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
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
      .select('status, invite_type')
      .eq('id', contestId)
      .single()

    if (contestError || !contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    }

    // Validate contest is active
    if (contest.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active contests can be joined' },
        { status: 400 }
      )
    }

    // Check if panelist is invited (if invite_type is selected_panelists)
    if (contest.invite_type === 'selected_panelists') {
      const { data: invitation } = await supabase
        .from('contest_invitations')
        .select('id')
        .eq('contest_id', contestId)
        .eq('panelist_id', panelistProfile.id)
        .single()

      if (!invitation) {
        return NextResponse.json(
          { error: 'You are not invited to this contest' },
          { status: 403 }
        )
      }
    }

    // Check if already joined
    const { data: existingParticipation } = await supabase
      .from('contest_participants')
      .select('id')
      .eq('contest_id', contestId)
      .eq('panelist_id', panelistProfile.id)
      .single()

    if (existingParticipation) {
      return NextResponse.json(
        { error: 'Already joined this contest' },
        { status: 400 }
      )
    }

    // Create participation record
    const { data: participation, error: participationError } = await supabase
      .from('contest_participants')
      .insert({
        contest_id: contestId,
        panelist_id: panelistProfile.id,
        points_earned: 0,
        rank: null
      })
      .select()
      .single()

    if (participationError) {
      console.error('Error joining contest:', participationError)
      return NextResponse.json({ error: 'Failed to join contest' }, { status: 500 })
    }

    // Update leaderboard to include new participant
    await supabase.rpc('update_contest_leaderboard', {
      p_contest_id: contestId
    })

    return NextResponse.json({
      participation,
      message: 'Successfully joined contest'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('Error in join contest API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

