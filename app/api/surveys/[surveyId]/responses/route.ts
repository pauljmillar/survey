import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth, hasPermission } from '@/lib/auth'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const user = await requireAuth('view_survey_analytics')
    const { surveyId } = await params

    // Get survey details
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single()

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    // Check permissions - survey admins can view their own surveys or any survey if they have analytics permission
    if (survey.created_by !== user.id && !hasPermission(user.role, 'view_survey_analytics')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get response count
    const { count: responseCount, error: countError } = await supabase
      .from('survey_completions')
      .select('*', { count: 'exact', head: true })
      .eq('survey_id', surveyId)

    if (countError) {
      console.error('Error counting responses:', countError)
      return NextResponse.json({ error: 'Failed to count responses' }, { status: 500 })
    }

    // Get detailed response data
    const { data: responses, error: responsesError } = await supabase
      .from('survey_completions')
      .select(`
        id,
        completed_at,
        points_earned,
        response_data,
        panelist:panelist_profiles!survey_completions_panelist_id_fkey(
          user_id,
          profile_data
        )
      `)
      .eq('survey_id', surveyId)
      .order('completed_at', { ascending: false })

    if (responsesError) {
      console.error('Error fetching responses:', responsesError)
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
    }

    return NextResponse.json({
      survey,
      response_count: responseCount || 0,
      responses: responses || []
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in survey responses GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 