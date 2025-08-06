import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth('complete_surveys')
    
    // First, get the panelist profile ID
    const { data: profile, error: profileError } = await supabase
      .from('panelist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Panelist profile not found for user:', user.id)
      return NextResponse.json({ 
        surveys: [], 
        message: 'Panelist profile not found. Please complete your profile setup.'
      })
    }

    // Get all active surveys first
    const { data: allSurveys, error: surveysError } = await supabase
      .from('surveys')
      .select(`
        id,
        title,
        description,
        points_reward,
        estimated_completion_time,
        status,
        created_at,
        updated_at
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (surveysError) {
      console.error('Error fetching all surveys:', surveysError)
      return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 })
    }

    // Get the survey IDs that this panelist has already completed
    const { data: completedSurveys, error: completedError } = await supabase
      .from('survey_completions')
      .select('survey_id, completed_at')
      .eq('panelist_id', profile.id)

    if (completedError) {
      console.error('Error fetching completed surveys:', completedError)
      return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 })
    }

    const completedSurveyMap = new Map(
      completedSurveys?.map(c => [c.survey_id, c.completed_at]) || []
    )

    // Add completion status to all surveys
    const surveysWithStatus = allSurveys?.map(survey => ({
      ...survey,
      is_completed: completedSurveyMap.has(survey.id),
      completed_at: completedSurveyMap.get(survey.id) || null
    })) || []

    // Sort surveys: available surveys first (newest first), then completed surveys (newest first)
    const sortedSurveys = surveysWithStatus.sort((a, b) => {
      // First, sort by completion status (available surveys first)
      if (a.is_completed !== b.is_completed) {
        return a.is_completed ? 1 : -1
      }
      
      // Then sort by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return NextResponse.json({ surveys: sortedSurveys })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in panelist surveys GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 