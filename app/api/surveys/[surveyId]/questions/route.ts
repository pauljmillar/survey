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
const questionSchema = z.object({
  question_text: z.string().min(1).max(1000),
  question_type: z.enum(['multiple_choice', 'text', 'rating', 'checkbox', 'yes_no', 'date_time']),
  question_order: z.number().min(1),
  is_required: z.boolean(),
  options: z.array(z.string()).nullable().optional(), // Make options optional and nullable
  validation_rules: z.record(z.any()).nullable().optional(), // Make validation_rules optional and nullable
})

const bulkQuestionsSchema = z.object({
  questions: z.array(questionSchema)
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const user = await requireAuth('create_surveys')
    const { surveyId } = await params

    // Get questions for the survey
    const { data: questions, error } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('question_order', { ascending: true })

    if (error) {
      console.error('Error fetching survey questions:', error)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    return NextResponse.json({ questions })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in survey questions GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const user = await requireAuth('create_surveys')
    const { surveyId } = await params
    const body = await request.json()

    console.log('Creating questions for survey:', surveyId)
    console.log('Request body:', body)

    // Validate request body
    const validation = bulkQuestionsSchema.safeParse(body)
    if (!validation.success) {
      console.error('Validation error:', validation.error.flatten())
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { questions } = validation.data

    // Check if survey exists and user has permission
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('created_by')
      .eq('id', surveyId)
      .single()

    if (surveyError || !survey) {
      console.error('Survey not found:', surveyId, surveyError)
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    if (survey.created_by !== user.id) {
      console.error('Permission denied for user:', user.id, 'survey created by:', survey.created_by)
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Prepare questions data
    const questionsData = questions.map(q => ({
      survey_id: surveyId,
      question_text: q.question_text,
      question_type: q.question_type,
      question_order: q.question_order,
      is_required: q.is_required,
      options: q.options || null,
      validation_rules: q.validation_rules || null
    }))

    console.log('Inserting questions:', questionsData)

    // Insert questions
    const { data: insertedQuestions, error } = await supabase
      .from('survey_questions')
      .insert(questionsData)
      .select()

    if (error) {
      console.error('Error creating survey questions:', error)
      return NextResponse.json({ 
        error: 'Failed to create questions', 
        details: error.message 
      }, { status: 500 })
    }

    console.log('Successfully created questions:', insertedQuestions)

    // Try to log activity, but don't fail if it doesn't work
    try {
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_activity_type: 'survey_questions_created',
        p_description: `Created ${questions.length} questions for survey`,
        p_metadata: { survey_id: surveyId, question_count: questions.length }
      })
    } catch (logError) {
      console.warn('Failed to log activity:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ questions: insertedQuestions }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in survey questions POST API:', error)
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
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

    console.log('PUT /questions - Request body:', body)

    // Validate request body
    const validation = bulkQuestionsSchema.safeParse(body)
    if (!validation.success) {
      console.error('PUT /questions - Validation error:', validation.error.flatten())
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { questions } = validation.data
    console.log('PUT /questions - Validated questions:', questions)

    // Check if survey exists and user has permission
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('created_by')
      .eq('id', surveyId)
      .single()

    if (surveyError || !survey) {
      console.error('PUT /questions - Survey not found:', surveyId, surveyError)
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    if (survey.created_by !== user.id) {
      console.error('PUT /questions - Permission denied for user:', user.id, 'survey created by:', survey.created_by)
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Delete existing questions
    console.log('PUT /questions - Deleting existing questions for survey:', surveyId)
    const { error: deleteError } = await supabase
      .from('survey_questions')
      .delete()
      .eq('survey_id', surveyId)

    if (deleteError) {
      console.error('PUT /questions - Error deleting existing questions:', deleteError)
      return NextResponse.json({ error: 'Failed to update questions', details: deleteError.message }, { status: 500 })
    }

    // Insert new questions
    const questionsToInsert = questions.map(q => ({
      survey_id: surveyId,
      question_text: q.question_text,
      question_type: q.question_type,
      question_order: q.question_order,
      is_required: q.is_required,
      options: q.options || null,
      validation_rules: q.validation_rules || null
    }))

    console.log('PUT /questions - Inserting questions:', questionsToInsert)

    const { data: insertedQuestions, error } = await supabase
      .from('survey_questions')
      .insert(questionsToInsert)
      .select()

    if (error) {
      console.error('PUT /questions - Error creating survey questions:', error)
      return NextResponse.json({ 
        error: 'Failed to update questions', 
        details: error.message 
      }, { status: 500 })
    }

    console.log('PUT /questions - Successfully updated questions:', insertedQuestions)

    // Try to log activity, but don't fail if it doesn't work
    try {
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_activity_type: 'survey_questions_updated',
        p_description: `Updated ${questions.length} questions for survey`,
        p_metadata: { survey_id: surveyId, question_count: questions.length }
      })
    } catch (logError) {
      console.warn('PUT /questions - Failed to log activity:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ questions: insertedQuestions })
  } catch (error) {
    console.error('PUT /questions - Unexpected error:', error)
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 