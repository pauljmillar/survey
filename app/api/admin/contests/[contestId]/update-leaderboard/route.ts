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

    // Check if contest exists
    const { data: contest, error: fetchError } = await supabase
      .from('contests')
      .select('id')
      .eq('id', contestId)
      .single()

    if (fetchError || !contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    }

    // Update leaderboard using database function
    const { error: leaderboardError } = await supabase.rpc('update_contest_leaderboard', {
      p_contest_id: contestId
    })

    if (leaderboardError) {
      console.error('Error updating leaderboard:', leaderboardError)
      return NextResponse.json(
        { error: leaderboardError.message || 'Failed to update leaderboard' },
        { status: 500 }
      )
    }

    // Get updated leaderboard
    const { data: participants, error: participantsError } = await supabase
      .from('contest_participants')
      .select('*')
      .eq('contest_id', contestId)
      .order('rank', { ascending: true, nullsLast: true })

    if (participantsError) {
      console.error('Error fetching updated leaderboard:', participantsError)
    }

    return NextResponse.json({
      message: 'Leaderboard updated successfully',
      participants: participants || []
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('Error in update leaderboard API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

