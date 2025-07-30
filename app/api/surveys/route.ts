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
const createSurveySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  points_reward: z.number().min(1),
  estimated_completion_time: z.number().min(1),
  qualification_criteria: z.record(z.any()).optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
})

const updateSurveySchema = createSurveySchema.partial()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get surveys - different access based on user role
    let query = supabase
      .from('surveys')
      .select(`
        id,
        title,
        description,
        points_reward,
        estimated_completion_time,
        qualification_criteria,
        status,
        created_by,
        created_at,
        updated_at
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: surveys, error } = await query

    if (error) {
      console.error('Error fetching surveys:', error)
      return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 })
    }

    return NextResponse.json({ surveys, total: surveys?.length || 0 })
  } catch (error) {
    console.error('Error in surveys GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth('create_surveys')
    const body = await request.json()

    // Validate request body
    const validation = createSurveySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const surveyData = validation.data

    // Create survey
    const { data: survey, error } = await supabase
      .from('surveys')
      .insert({
        title: surveyData.title,
        description: surveyData.description,
        points_reward: surveyData.points_reward,
        estimated_completion_time: surveyData.estimated_completion_time,
        qualification_criteria: surveyData.qualification_criteria || {},
        status: surveyData.status || 'draft',
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating survey:', error)
      return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 })
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_activity_type: 'survey_created',
      p_description: `Created survey: ${survey.title}`,
      p_metadata: { survey_id: survey.id }
    })

    return NextResponse.json(survey, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in surveys POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth('create_surveys')
    const { searchParams } = new URL(request.url)
    const surveyId = searchParams.get('id')

    if (!surveyId) {
      return NextResponse.json({ error: 'Survey ID required' }, { status: 400 })
    }

    const body = await request.json()

    // Validate request body
    const validation = updateSurveySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const updates = validation.data

    // Check if user owns the survey or is system admin
    const { data: existingSurvey } = await supabase
      .from('surveys')
      .select('created_by')
      .eq('id', surveyId)
      .single()

    if (!existingSurvey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    // Get user role to check permissions
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (existingSurvey.created_by !== user.id && userData?.role !== 'system_admin') {
      return NextResponse.json({ error: 'Cannot update surveys created by others' }, { status: 403 })
    }

    // Update survey
    const { data: survey, error } = await supabase
      .from('surveys')
      .update(updates)
      .eq('id', surveyId)
      .select()
      .single()

    if (error) {
      console.error('Error updating survey:', error)
      return NextResponse.json({ error: 'Failed to update survey' }, { status: 500 })
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_activity_type: 'survey_updated',
      p_description: `Updated survey: ${survey.title}`,
      p_metadata: { survey_id: survey.id, updates }
    })

    return NextResponse.json(survey)
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in surveys PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth('create_surveys')
    const { searchParams } = new URL(request.url)
    const surveyId = searchParams.get('id')

    if (!surveyId) {
      return NextResponse.json({ error: 'Survey ID required' }, { status: 400 })
    }

    // Check if user owns the survey or is system admin
    const { data: existingSurvey } = await supabase
      .from('surveys')
      .select('created_by, title')
      .eq('id', surveyId)
      .single()

    if (!existingSurvey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    // Get user role to check permissions
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (existingSurvey.created_by !== user.id && userData?.role !== 'system_admin') {
      return NextResponse.json({ error: 'Cannot delete surveys created by others' }, { status: 403 })
    }

    // Delete survey (cascade will handle related records)
    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', surveyId)

    if (error) {
      console.error('Error deleting survey:', error)
      return NextResponse.json({ error: 'Failed to delete survey' }, { status: 500 })
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_activity_type: 'survey_deleted',
      p_description: `Deleted survey: ${existingSurvey.title}`,
      p_metadata: { survey_id: surveyId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in surveys DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 