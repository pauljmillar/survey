import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation schema for contest creation/updates
const contestSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  prize_points: z.number().int().positive(),
  invite_type: z.enum(['all_panelists', 'selected_panelists']),
  panelist_ids: z.array(z.string().uuid()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth('manage_contests')
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Build query
    let query = supabase
      .from('contests')
      .select(`
        *,
        created_by_user:users!contests_created_by_fkey(email)
      `)
      .order('created_at', { ascending: false })

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: contests, error, count } = await query

    if (error) {
      console.error('Error fetching contests:', error)
      return NextResponse.json({ error: 'Failed to fetch contests' }, { status: 500 })
    }

    // Get participant counts for each contest
    const contestsWithCounts = await Promise.all(
      (contests || []).map(async (contest) => {
        const { count: participantCount } = await supabase
          .from('contest_participants')
          .select('*', { count: 'exact', head: true })
          .eq('contest_id', contest.id)
        
        return {
          ...contest,
          participant_count: participantCount || 0
        }
      })
    )

    return NextResponse.json({
      contests: contestsWithCounts,
      total: count,
      limit,
      offset,
      hasMore: (contests?.length || 0) === limit
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('Error in contests GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth('manage_contests')
    const body = await request.json()

    // Validate request body
    const validation = contestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const { title, description, start_date, end_date, prize_points, invite_type, panelist_ids } = validation.data

    // Validate dates
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Validate invite_type and panelist_ids
    if (invite_type === 'selected_panelists' && (!panelist_ids || panelist_ids.length === 0)) {
      return NextResponse.json(
        { error: 'panelist_ids required when invite_type is selected_panelists' },
        { status: 400 }
      )
    }

    // Create contest
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .insert({
        title,
        description: description || null,
        start_date: start_date,
        end_date: end_date,
        prize_points,
        invite_type,
        created_by: user.id,
        status: 'draft'
      })
      .select()
      .single()

    if (contestError) {
      console.error('Error creating contest:', contestError)
      return NextResponse.json({ error: 'Failed to create contest' }, { status: 500 })
    }

    // Create invitations if selected_panelists
    if (invite_type === 'selected_panelists' && panelist_ids && panelist_ids.length > 0) {
      // Convert user_ids to panelist_profile ids
      const { data: panelistProfiles } = await supabase
        .from('panelist_profiles')
        .select('id')
        .in('user_id', panelist_ids)

      if (panelistProfiles && panelistProfiles.length > 0) {
        const invitations = panelistProfiles.map(profile => ({
          contest_id: contest.id,
          panelist_id: profile.id,
          invited_by: user.id
        }))

        const { error: inviteError } = await supabase
          .from('contest_invitations')
          .insert(invitations)

        if (inviteError) {
          console.error('Error creating invitations:', inviteError)
          // Continue anyway - contest is created
        }
      }
    }

    return NextResponse.json({
      contest,
      message: 'Contest created successfully'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('Error in contests POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

