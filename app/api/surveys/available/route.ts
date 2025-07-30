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
    const { data: profile } = await supabase
      .from('panelist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Panelist profile not found' }, { status: 404 })
    }

    // Get available surveys for this panelist
    // 1. Active surveys
    // 2. Panelist is qualified
    // 3. Panelist hasn't completed yet
    const { data: availableSurveys, error } = await supabase
      .from('surveys')
      .select(`
        id,
        title,
        description,
        points_reward,
        estimated_completion_time,
        created_at,
        survey_qualifications!inner(is_qualified)
      `)
      .eq('status', 'active')
      .eq('survey_qualifications.panelist_id', profile.id)
      .eq('survey_qualifications.is_qualified', true)
      .not('id', 'in', `(
        SELECT survey_id 
        FROM survey_completions 
        WHERE panelist_id = '${profile.id}'
      )`)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching available surveys:', error)
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
      total: cleanSurveys.length 
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in available surveys API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 