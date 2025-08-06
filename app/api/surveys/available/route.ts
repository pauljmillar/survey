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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get panelist profile
    const { data: profile, error: profileError } = await supabase
      .from('panelist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('Panelist profile not found for user:', user.id)
      return NextResponse.json({ 
        surveys: [], 
        total: 0,
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
        created_at
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (surveysError) {
      console.error('Error fetching all surveys:', surveysError)
      return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 })
    }

    // If no active surveys exist, return empty result
    if (!allSurveys || allSurveys.length === 0) {
      return NextResponse.json({ 
        surveys: [], 
        total: 0,
        message: 'No surveys are currently available.'
      })
    }

    // Get completed survey IDs for this panelist
    const { data: completedSurveys, error: completedError } = await supabase
      .from('survey_completions')
      .select('survey_id')
      .eq('panelist_id', profile.id)

    if (completedError) {
      console.error('Error fetching completed surveys:', completedError)
      return NextResponse.json({ error: 'Failed to fetch survey completion data' }, { status: 500 })
    }

    // Create a set of completed survey IDs for efficient lookup
    const completedSurveyIds = new Set(completedSurveys?.map(c => c.survey_id) || [])

    // Filter out completed surveys in JavaScript
    const availableSurveys = allSurveys.filter(survey => !completedSurveyIds.has(survey.id))

    // Apply pagination
    const paginatedSurveys = availableSurveys.slice(offset, offset + limit)

    return NextResponse.json({ 
      surveys: paginatedSurveys, 
      total: availableSurveys.length,
      message: availableSurveys.length === 0 ? 'No surveys are currently available.' : undefined
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in available surveys API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 