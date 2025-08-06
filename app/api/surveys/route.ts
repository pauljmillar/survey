import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth, hasPermission } from '@/lib/auth'
import { z } from 'zod'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation schema for survey creation/updates
const surveySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  points_reward: z.number().min(0),
  estimated_completion_time: z.number().min(1),
  status: z.enum(['draft', 'active', 'inactive']).default('draft'),
  target_audience: z.record(z.any()).optional(),
  qualification_criteria: z.record(z.any()).optional(),
})

// Function to calculate audience count based on qualification criteria
async function calculateAudienceCount(surveyId: string): Promise<number> {
  try {
    // This is a simplified calculation - in a real app, you'd have more complex logic
    const { count } = await supabase
      .from('panelist_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    return count || 0
  } catch (error) {
    console.error('Error calculating audience count:', error)
    return 0
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth('create_surveys')
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const page = parseInt(searchParams.get('page') || '1')
    
    // Build query
    let query = supabase
      .from('surveys')
      .select(`
        *,
        created_by_user:users!surveys_created_by_fkey(email)
      `)
      .order('created_at', { ascending: false })

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply pagination
    const actualOffset = page > 1 ? (page - 1) * limit : offset
    query = query.range(actualOffset, actualOffset + limit - 1)

    const { data: surveys, error, count } = await query

    if (error) {
      console.error('Error fetching surveys:', error)
      return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 })
    }

    // Calculate audience counts for each survey
    const surveysWithAudience = await Promise.all(
      surveys?.map(async (survey) => ({
        ...survey,
        audience_count: await calculateAudienceCount(survey.id)
      })) || []
    )

    return NextResponse.json({
      surveys: surveysWithAudience,
      total: count,
      page,
      limit,
      hasMore: surveysWithAudience.length === limit
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in surveys GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth('create_surveys')
    const body = await request.json()

    // Validate request body
    const validation = surveySchema.safeParse(body)
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
        ...surveyData,
        created_by: user.id,
        audience_count: await calculateAudienceCount('new') // Will be updated after creation
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
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const surveyId = searchParams.get('id')

    if (!surveyId) {
      return NextResponse.json({ error: 'Survey ID required' }, { status: 400 })
    }

    // Validate request body
    const validation = surveySchema.partial().safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const updates = validation.data

    // Check if survey exists and user has permission
    const { data: existingSurvey } = await supabase
      .from('surveys')
      .select('created_by')
      .eq('id', surveyId)
      .single()

    if (!existingSurvey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    // Allow survey admins to edit any survey, or users to edit their own surveys
    if (existingSurvey.created_by !== user.id && !hasPermission(user.role, 'manage_qualifications')) {
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

    // Check if survey exists and user has permission
    const { data: existingSurvey } = await supabase
      .from('surveys')
      .select('created_by, title')
      .eq('id', surveyId)
      .single()

    if (!existingSurvey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    // Allow survey admins to delete any survey, or users to delete their own surveys
    if (existingSurvey.created_by !== user.id && !hasPermission(user.role, 'manage_qualifications')) {
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