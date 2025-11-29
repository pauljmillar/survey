import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const inviteSchema = z.object({
  panelist_ids: z.array(z.string().uuid()).min(1)
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
    const validation = inviteSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const { panelist_ids } = validation.data

    // Check if contest exists
    const { data: contest, error: fetchError } = await supabase
      .from('contests')
      .select('id, invite_type')
      .eq('id', contestId)
      .single()

    if (fetchError || !contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    }

    // Convert user_ids to panelist_profile ids
    const { data: panelistProfiles, error: profileError } = await supabase
      .from('panelist_profiles')
      .select('id')
      .in('user_id', panelist_ids)

    if (profileError) {
      console.error('Error fetching panelist profiles:', profileError)
      return NextResponse.json({ error: 'Failed to fetch panelist profiles' }, { status: 500 })
    }

    if (!panelistProfiles || panelistProfiles.length === 0) {
      return NextResponse.json({ error: 'No valid panelists found' }, { status: 400 })
    }

    // Create invitations (ignore duplicates)
    const invitations = panelistProfiles.map(profile => ({
      contest_id: contestId,
      panelist_id: profile.id,
      invited_by: user.id
    }))

    const { data: createdInvitations, error: inviteError } = await supabase
      .from('contest_invitations')
      .upsert(invitations, {
        onConflict: 'contest_id,panelist_id',
        ignoreDuplicates: true
      })
      .select()

    if (inviteError) {
      console.error('Error creating invitations:', inviteError)
      return NextResponse.json({ error: 'Failed to create invitations' }, { status: 500 })
    }

    return NextResponse.json({
      invitations: createdInvitations,
      message: `Successfully invited ${createdInvitations?.length || 0} panelists`
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('Error in invite panelists API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

