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
      .select('survey_id')
      .eq('panelist_id', profile.id)

    if (completedError) {
      console.error('Error fetching completed surveys:', completedError)
      return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 })
    }

    const completedSurveyIds = new Set(completedSurveys?.map(c => c.survey_id) || [])

    // Filter out completed surveys in JavaScript
    const availableSurveys = allSurveys?.filter(survey => !completedSurveyIds.has(survey.id)) || []

    return NextResponse.json({ surveys: availableSurveys })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in panelist surveys GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 