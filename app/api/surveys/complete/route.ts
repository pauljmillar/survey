import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const completeSurveySchema = z.object({
  survey_id: z.string().uuid(),
  response_data: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth('complete_surveys')
    const body = await request.json()

    // Validate request body
    const validation = completeSurveySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { survey_id, response_data } = validation.data

    // Get panelist profile
    const { data: profile } = await supabase
      .from('panelist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Panelist profile not found' }, { status: 404 })
    }

    // Get survey details and verify it's active
    const { data: survey } = await supabase
      .from('surveys')
      .select('id, title, points_reward, status')
      .eq('id', survey_id)
      .single()

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    if (survey.status !== 'active') {
      return NextResponse.json({ error: 'Survey is not active' }, { status: 400 })
    }

    // Check if panelist is qualified
    const { data: qualification } = await supabase
      .from('survey_qualifications')
      .select('is_qualified')
      .eq('survey_id', survey_id)
      .eq('panelist_id', profile.id)
      .single()

    if (!qualification || !qualification.is_qualified) {
      return NextResponse.json({ error: 'Not qualified for this survey' }, { status: 403 })
    }

    // Check if already completed
    const { data: existingCompletion } = await supabase
      .from('survey_completions')
      .select('id')
      .eq('survey_id', survey_id)
      .eq('panelist_id', profile.id)
      .single()

    if (existingCompletion) {
      return NextResponse.json({ error: 'Survey already completed' }, { status: 409 })
    }

    // Create completion record
    const { data: completion, error: completionError } = await supabase
      .from('survey_completions')
      .insert({
        survey_id: survey_id,
        panelist_id: profile.id,
        points_earned: survey.points_reward,
        response_data: response_data || {},
      })
      .select()
      .single()

    if (completionError) {
      console.error('Error creating survey completion:', completionError)
      return NextResponse.json({ error: 'Failed to complete survey' }, { status: 500 })
    }

    // Award points using the database function
    try {
      const { error: pointsError } = await supabase.rpc('update_panelist_points', {
        p_panelist_id: profile.id,
        p_points_change: survey.points_reward,
        p_activity_description: `Completed survey: ${survey.title}`
      })

      if (pointsError) {
        console.error('Error awarding points:', pointsError)
        // Rollback completion if points award fails
        await supabase.from('survey_completions').delete().eq('id', completion.id)
        return NextResponse.json({ error: 'Failed to award points' }, { status: 500 })
      }
    } catch (pointsError) {
      console.error('Error in points transaction:', pointsError)
      // Rollback completion
      await supabase.from('survey_completions').delete().eq('id', completion.id)
      return NextResponse.json({ error: 'Failed to process point award' }, { status: 500 })
    }

    // Get updated profile to return current balance
    const { data: updatedProfile } = await supabase
      .from('panelist_profiles')
      .select('points_balance, total_points_earned')
      .eq('id', profile.id)
      .single()

    return NextResponse.json({
      success: true,
      completion_id: completion.id,
      points_earned: survey.points_reward,
      new_balance: updatedProfile?.points_balance || 0,
      total_earned: updatedProfile?.total_points_earned || 0,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in survey completion API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 