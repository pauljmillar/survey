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
      .select('status, start_date')
      .eq('id', contestId)
      .single()

    if (fetchError || !contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    }

    if (contest.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft contests can be started' },
        { status: 400 }
      )
    }

    // Validate start_date is in future or now
    const startDate = new Date(contest.start_date)
    const now = new Date()
    
    // Allow starting if start_date is within the last hour (to account for timezone issues)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    if (startDate < oneHourAgo) {
      return NextResponse.json(
        { error: 'Start date must be in the future or very recent' },
        { status: 400 }
      )
    }

    // Update contest status to active
    const { data: updatedContest, error: updateError } = await supabase
      .from('contests')
      .update({ status: 'active' })
      .eq('id', contestId)
      .select()
      .single()

    if (updateError) {
      console.error('Error starting contest:', updateError)
      return NextResponse.json({ error: 'Failed to start contest' }, { status: 500 })
    }

    return NextResponse.json({
      contest: updatedContest,
      message: 'Contest started successfully'
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('Error in contest start API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

