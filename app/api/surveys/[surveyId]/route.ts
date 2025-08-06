import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation schema for survey updates
const surveyUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  points_reward: z.number().min(0).optional(),
  estimated_completion_time: z.number().min(1).optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const user = await requireAuth('read_survey_questions')
    const { surveyId } = await params

    const { data: survey, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single()

    if (error || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    // Check if user has permission to view this survey
    // Panelists can view active surveys, survey admins can view their own surveys
    if (survey.created_by !== user.id && !hasPermission(user.role, 'view_survey_analytics')) {
      // For panelists, only allow viewing active surveys
      if (survey.status !== 'active') {
        return NextResponse.json({ error: 'Survey not available' }, { status: 403 })
      }
    }

    return NextResponse.json({ survey })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in survey GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const user = await requireAuth('create_surveys')
    const { surveyId } = await params
    const body = await request.json()

    // Validate request body
    const validation = surveyUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Check if survey exists and user has permission to edit
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single()

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    if (survey.created_by !== user.id && !hasPermission(user.role, 'manage_qualifications')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Update survey
    const { data: updatedSurvey, error: updateError } = await supabase
      .from('surveys')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString()
      })
      .eq('id', surveyId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating survey:', updateError)
      return NextResponse.json({ error: 'Failed to update survey' }, { status: 500 })
    }

    // Try to log activity
    try {
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_activity_type: 'survey_updated',
        p_description: `Updated survey: ${updatedSurvey.title}`,
        p_metadata: { survey_id: surveyId }
      })
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    return NextResponse.json({ survey: updatedSurvey })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in survey PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const user = await requireAuth('create_surveys')
    const { surveyId } = await params

    // Check if survey exists and user has permission to delete
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single()

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    if (survey.created_by !== user.id && !hasPermission(user.role, 'manage_qualifications')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    console.log(`Deleting survey ${surveyId} and all related data...`)

    // Delete in the correct order to handle foreign key constraints
    // 1. Delete survey responses (these reference survey_questions)
    const { error: responsesError } = await supabase
      .from('survey_responses')
      .delete()
      .eq('survey_id', surveyId)

    if (responsesError) {
      console.error('Error deleting survey responses:', responsesError)
      return NextResponse.json({ error: 'Failed to delete survey responses' }, { status: 500 })
    }

    // 2. Delete survey questions
    const { error: questionsError } = await supabase
      .from('survey_questions')
      .delete()
      .eq('survey_id', surveyId)

    if (questionsError) {
      console.error('Error deleting survey questions:', questionsError)
      return NextResponse.json({ error: 'Failed to delete survey questions' }, { status: 500 })
    }

    // 3. Delete survey completions
    const { error: completionsError } = await supabase
      .from('survey_completions')
      .delete()
      .eq('survey_id', surveyId)

    if (completionsError) {
      console.error('Error deleting survey completions:', completionsError)
      return NextResponse.json({ error: 'Failed to delete survey completions' }, { status: 500 })
    }

    // 4. Delete survey qualifications
    const { error: qualificationsError } = await supabase
      .from('survey_qualifications')
      .delete()
      .eq('survey_id', surveyId)

    if (qualificationsError) {
      console.error('Error deleting survey qualifications:', qualificationsError)
      return NextResponse.json({ error: 'Failed to delete survey qualifications' }, { status: 500 })
    }

    // 5. Finally, delete the survey itself
    const { error: surveyDeleteError } = await supabase
      .from('surveys')
      .delete()
      .eq('id', surveyId)

    if (surveyDeleteError) {
      console.error('Error deleting survey:', surveyDeleteError)
      return NextResponse.json({ error: 'Failed to delete survey' }, { status: 500 })
    }

    // Log the deletion activity
    try {
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_activity_type: 'survey_deleted',
        p_description: `Deleted survey: ${survey.title}`,
        p_metadata: { 
          survey_id: surveyId,
          survey_title: survey.title,
          deleted_at: new Date().toISOString()
        }
      })
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
    }

    console.log(`Successfully deleted survey ${surveyId} and all related data`)

    return NextResponse.json({ 
      success: true,
      message: 'Survey and all related data deleted successfully'
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in survey DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to check permissions
function hasPermission(userRole: string, permission: string): boolean {
  const permissions = {
    'view_survey_analytics': ['survey_admin', 'system_admin'],
    'create_surveys': ['survey_admin', 'system_admin'],
    'manage_qualifications': ['survey_admin', 'system_admin']
  }
  return permissions[permission as keyof typeof permissions]?.includes(userRole) || false
} 