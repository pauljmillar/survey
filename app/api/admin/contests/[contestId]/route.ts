import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation schema for contest updates
const contestUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  prize_points: z.number().int().positive().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contestId: string }> }
) {
  try {
    const user = await requireAuth('manage_contests')
    const { contestId } = await params

    // Get contest details
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select(`
        *,
        created_by_user:users!contests_created_by_fkey(email)
      `)
      .eq('id', contestId)
      .single()

    if (contestError || !contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    }

    // Get participants with their profile data
    const { data: participants, error: participantsError } = await supabase
      .from('contest_participants')
      .select(`
        *,
        panelist:panelist_profiles!inner(
          id,
          user_id,
          users!inner(email)
        )
      `)
      .eq('contest_id', contestId)
      .order('rank', { ascending: true })

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
    }

    // Get participant count
    const { count: participantCount } = await supabase
      .from('contest_participants')
      .select('*', { count: 'exact', head: true })
      .eq('contest_id', contestId)

    return NextResponse.json({
      contest,
      participants: participants || [],
      participant_count: participantCount || 0
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('Error in contest GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ contestId: string }> }
) {
  try {
    const user = await requireAuth('manage_contests')
    const { contestId } = await params
    const body = await request.json()

    // Validate request body
    const validation = contestUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    // Check if contest exists and hasn't ended
    const { data: existingContest, error: fetchError } = await supabase
      .from('contests')
      .select('status, start_date, end_date')
      .eq('id', contestId)
      .single()

    if (fetchError || !existingContest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    }

    if (existingContest.status === 'ended') {
      return NextResponse.json(
        { error: 'Cannot update ended contest' },
        { status: 400 }
      )
    }

    // Validate dates if provided
    const updateData: any = {}
    if (validation.data.title !== undefined) updateData.title = validation.data.title
    if (validation.data.description !== undefined) updateData.description = validation.data.description
    if (validation.data.prize_points !== undefined) updateData.prize_points = validation.data.prize_points

    if (validation.data.start_date || validation.data.end_date) {
      const startDate = validation.data.start_date 
        ? new Date(validation.data.start_date) 
        : new Date(existingContest.start_date)
      const endDate = validation.data.end_date 
        ? new Date(validation.data.end_date) 
        : new Date(existingContest.end_date)

      if (endDate <= startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }

      if (validation.data.start_date) updateData.start_date = validation.data.start_date
      if (validation.data.end_date) updateData.end_date = validation.data.end_date
    }

    // Update contest
    const { data: contest, error: updateError } = await supabase
      .from('contests')
      .update(updateData)
      .eq('id', contestId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating contest:', updateError)
      return NextResponse.json({ error: 'Failed to update contest' }, { status: 500 })
    }

    return NextResponse.json({
      contest,
      message: 'Contest updated successfully'
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('Error in contest PATCH API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

