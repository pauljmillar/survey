import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contestId: string }> }
) {
  try {
    const user = await requireAuth('manage_contests')
    const { contestId } = await params

    // Get contest details
    const { data: contest, error: fetchError } = await supabase
      .from('contests')
      .select('status')
      .eq('id', contestId)
      .single()

    if (fetchError || !contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    }

    if (contest.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active contests can be ended' },
        { status: 400 }
      )
    }

    // Update contest status to ended
    const { data: updatedContest, error: updateError } = await supabase
      .from('contests')
      .update({ status: 'ended' })
      .eq('id', contestId)
      .select()
      .single()

    if (updateError) {
      console.error('Error ending contest:', updateError)
      return NextResponse.json({ error: 'Failed to end contest' }, { status: 500 })
    }

    // Update final leaderboard
    const { error: leaderboardError } = await supabase.rpc('update_contest_leaderboard', {
      p_contest_id: contestId
    })

    if (leaderboardError) {
      console.error('Error updating leaderboard:', leaderboardError)
      // Continue anyway - contest is ended
    }

    return NextResponse.json({
      contest: updatedContest,
      message: 'Contest ended successfully and leaderboard updated'
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('Error in contest end API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

