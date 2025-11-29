import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const awardPrizeSchema = z.object({
  panelist_id: z.string().uuid()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contestId: string }> }
) {
  try {
    const user = await requireAuth('manage_contests')
    const { contestId } = await params
    const body = await request.json()

    // Validate request body
    const validation = awardPrizeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const { panelist_id } = validation.data

    // Check if contest exists and has ended
    const { data: contest, error: fetchError } = await supabase
      .from('contests')
      .select('status')
      .eq('id', contestId)
      .single()

    if (fetchError || !contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    }

    if (contest.status !== 'ended') {
      return NextResponse.json(
        { error: 'Prizes can only be awarded for ended contests' },
        { status: 400 }
      )
    }

    // Check if participant exists
    const { data: participant, error: participantError } = await supabase
      .from('contest_participants')
      .select('id, prize_awarded')
      .eq('contest_id', contestId)
      .eq('panelist_id', panelist_id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    if (participant.prize_awarded) {
      return NextResponse.json(
        { error: 'Prize already awarded to this participant' },
        { status: 400 }
      )
    }

    // Award prize using database function
    const { data: ledgerEntryId, error: awardError } = await supabase.rpc('award_contest_prize', {
      p_contest_id: contestId,
      p_panelist_id: panelist_id,
      p_awarded_by: user.id
    })

    if (awardError) {
      console.error('Error awarding prize:', awardError)
      return NextResponse.json(
        { error: awardError.message || 'Failed to award prize' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ledger_entry_id: ledgerEntryId,
      message: 'Prize awarded successfully'
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('Error in award prize API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

