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

    // First, check if there are any active surveys at all
    const { data: activeSurveys, error: surveysError } = await supabase
      .from('surveys')
      .select('id')
      .eq('status', 'active')
      .limit(1)

    if (surveysError) {
      console.error('Error checking for active surveys:', surveysError)
      return NextResponse.json({ error: 'Failed to check survey availability' }, { status: 500 })
    }

    // If no active surveys exist, return empty result
    if (!activeSurveys || activeSurveys.length === 0) {
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

    // Extract completed survey IDs
    const completedSurveyIds = completedSurveys?.map(c => c.survey_id) || []

    // Get available surveys for this panelist
    // 1. Active surveys
    // 2. Panelist hasn't completed yet
    let query = supabase
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

    // Only add the .not() filter if there are completed surveys
    if (completedSurveyIds.length > 0) {
      query = query.not('id', 'in', completedSurveyIds)
    }

    const { data: availableSurveys, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching available surveys:', error)
      // If the error is due to no qualifications, return empty result instead of error
      if (error.message.includes('survey_qualifications') || error.message.includes('join')) {
        return NextResponse.json({ 
          surveys: [], 
          total: 0,
          message: 'No surveys are currently available for your profile.'
        })
      }
      return NextResponse.json({ error: 'Failed to fetch available surveys' }, { status: 500 })
    }

    // Clean up the response to remove join data
    const cleanSurveys = availableSurveys?.map(survey => ({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      points_reward: survey.points_reward,
      estimated_completion_time: survey.estimated_completion_time,
      created_at: survey.created_at,
    })) || []

    return NextResponse.json({ 
      surveys: cleanSurveys, 
      total: cleanSurveys.length,
      message: cleanSurveys.length === 0 ? 'No surveys are currently available.' : undefined
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in available surveys API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 