import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation schemas
const surveyResponseSchema = z.object({
  question_id: z.string(),
  response_value: z.string(),
  response_metadata: z.record(z.any()).optional()
})

const surveyCompletionSchema = z.object({
  survey_id: z.string(),
  responses: z.array(surveyResponseSchema)
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth('complete_surveys')
    const body = await request.json()

    console.log('Survey completion request:', { user_id: user.id, body })

    // Validate request body
    const validation = surveyCompletionSchema.safeParse(body)
    if (!validation.success) {
      console.error('Validation error:', validation.error.flatten())
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { survey_id, responses } = validation.data
    console.log('Validated data:', { survey_id, responses_count: responses.length })

    // Get panelist profile ID
    const { data: profile, error: profileError } = await supabase
      .from('panelist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Panelist profile not found for user:', user.id)
      return NextResponse.json({ error: 'Panelist profile not found' }, { status: 404 })
    }

    // Check if survey exists and is active
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', survey_id)
      .eq('status', 'active')
      .single()

    if (surveyError || !survey) {
      console.error('Survey not found or not active:', surveyError)
      return NextResponse.json({ error: 'Survey not found or not active' }, { status: 404 })
    }

    console.log('Found survey:', survey.title)

    // Check if panelist has already completed this survey
    const { data: existingCompletion, error: completionCheckError } = await supabase
      .from('survey_completions')
      .select('id')
      .eq('survey_id', survey_id)
      .eq('panelist_id', profile.id)
      .single()

    if (existingCompletion) {
      console.log('Survey already completed by user')
      return NextResponse.json({ error: 'Survey already completed' }, { status: 409 })
    }

    console.log('Proceeding with survey completion...')

    // Start a transaction
    const { data: completion, error: completionError } = await supabase
      .from('survey_completions')
      .insert({
        survey_id,
        panelist_id: profile.id,
        points_earned: survey.points_reward,
        completed_at: new Date().toISOString(),
        response_data: { responses }
      })
      .select()
      .single()

    if (completionError) {
      console.error('Error creating survey completion:', completionError)
      return NextResponse.json({ error: 'Failed to record survey completion' }, { status: 500 })
    }

    console.log('Survey completion recorded:', completion.id)

    // Insert individual responses
    const surveyResponses = responses.map(response => ({
      survey_id,
      panelist_id: profile.id,
      question_id: response.question_id,
      response_value: response.response_value,
      response_metadata: response.response_metadata || null
    }))

    const { error: responsesError } = await supabase
      .from('survey_responses')
      .insert(surveyResponses)

    if (responsesError) {
      console.error('Error inserting survey responses:', responsesError)
      // Note: We don't fail here since the completion is already recorded
    } else {
      console.log('Survey responses inserted successfully')
    }

    // Update panelist's points balance and survey count
    const { data: updatedProfile, error: updateError } = await supabase
      .from('panelist_profiles')
      .update({
        points_balance: (profile.points_balance || 0) + survey.points_reward,
        total_points_earned: (profile.total_points_earned || 0) + survey.points_reward,
        surveys_completed: (profile.surveys_completed || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
      .select('points_balance, total_points_earned, surveys_completed')
      .single()

    if (updateError) {
      console.error('Error updating panelist profile:', updateError)
      return NextResponse.json({ error: 'Failed to update points balance' }, { status: 500 })
    }

    console.log('Points updated successfully')

    // Try to log activity, but don't fail if it doesn't work
    try {
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_activity_type: 'survey_completed',
        p_description: `Completed survey: ${survey.title}`,
        p_metadata: { 
          survey_id, 
          points_earned: survey.points_reward,
          question_count: responses.length 
        }
      })
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
      // Don't fail the request if logging fails
    }

    console.log('Survey completion successful')

    return NextResponse.json({ 
      success: true,
      points_earned: survey.points_reward,
      completion_id: completion.id,
      new_balance: updatedProfile.points_balance,
      total_earned: updatedProfile.total_points_earned
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in survey completion POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 