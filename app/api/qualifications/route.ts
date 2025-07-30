import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const updateQualificationSchema = z.object({
  survey_id: z.string().uuid(),
  panelist_id: z.string().uuid(),
  is_qualified: z.boolean(),
})

const bulkQualificationSchema = z.object({
  survey_id: z.string().uuid(),
  qualifications: z.array(z.object({
    panelist_id: z.string().uuid(),
    is_qualified: z.boolean(),
  })),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth('manage_qualifications')
    const { searchParams } = new URL(request.url)
    const surveyId = searchParams.get('survey_id')
    const panelistId = searchParams.get('panelist_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!surveyId) {
      return NextResponse.json({ error: 'Survey ID required' }, { status: 400 })
    }

    // Verify survey exists and user has access
    const { data: survey } = await supabase
      .from('surveys')
      .select('id, title, created_by')
      .eq('id', surveyId)
      .single()

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    // Get user role to check permissions
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // Only survey creator or system admin can manage qualifications
    if (survey.created_by !== user.id && userData?.role !== 'system_admin') {
      return NextResponse.json({ error: 'Cannot manage qualifications for surveys created by others' }, { status: 403 })
    }

    // Build query for qualifications
    let query = supabase
      .from('survey_qualifications')
      .select(`
        id,
        is_qualified,
        created_at,
        panelist_profiles (
          id,
          profile_data,
          users (
            email
          )
        )
      `)
      .eq('survey_id', surveyId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (panelistId) {
      query = query.eq('panelist_id', panelistId)
    }

    const { data: qualifications, error } = await query

    if (error) {
      console.error('Error fetching qualifications:', error)
      return NextResponse.json({ error: 'Failed to fetch qualifications' }, { status: 500 })
    }

    return NextResponse.json({
      survey_id: surveyId,
      qualifications: qualifications || [],
      total: qualifications?.length || 0,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in qualifications GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth('manage_qualifications')
    const body = await request.json()

    // Check if this is a bulk operation
    const isBulk = 'qualifications' in body
    
    if (isBulk) {
      // Validate bulk request
      const validation = bulkQualificationSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid bulk input', details: validation.error.flatten() },
          { status: 400 }
        )
      }

      const { survey_id, qualifications } = validation.data

      // Verify survey exists and user has access
      const { data: survey } = await supabase
        .from('surveys')
        .select('id, title, created_by')
        .eq('id', survey_id)
        .single()

      if (!survey) {
        return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
      }

      // Get user role to check permissions
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (survey.created_by !== user.id && userData?.role !== 'system_admin') {
        return NextResponse.json({ error: 'Cannot manage qualifications for surveys created by others' }, { status: 403 })
      }

      // Process bulk qualifications with upsert
      const qualificationRecords = qualifications.map(q => ({
        survey_id: survey_id,
        panelist_id: q.panelist_id,
        is_qualified: q.is_qualified,
      }))

      const { data: results, error } = await supabase
        .from('survey_qualifications')
        .upsert(qualificationRecords, {
          onConflict: 'survey_id,panelist_id',
          ignoreDuplicates: false
        })
        .select()

      if (error) {
        console.error('Error creating bulk qualifications:', error)
        return NextResponse.json({ error: 'Failed to create bulk qualifications' }, { status: 500 })
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_activity_type: 'qualifications_bulk_updated',
        p_description: `Updated ${qualifications.length} qualifications for survey: ${survey.title}`,
        p_metadata: { survey_id: survey_id, count: qualifications.length }
      })

      return NextResponse.json({
        success: true,
        updated_count: results?.length || 0,
        qualifications: results,
      }, { status: 201 })
    } else {
      // Single qualification update
      const validation = updateQualificationSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.flatten() },
          { status: 400 }
        )
      }

      const { survey_id, panelist_id, is_qualified } = validation.data

      // Verify survey exists and user has access
      const { data: survey } = await supabase
        .from('surveys')
        .select('id, title, created_by')
        .eq('id', survey_id)
        .single()

      if (!survey) {
        return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
      }

      // Get user role to check permissions
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (survey.created_by !== user.id && userData?.role !== 'system_admin') {
        return NextResponse.json({ error: 'Cannot manage qualifications for surveys created by others' }, { status: 403 })
      }

      // Verify panelist exists
      const { data: panelist } = await supabase
        .from('panelist_profiles')
        .select('id')
        .eq('id', panelist_id)
        .single()

      if (!panelist) {
        return NextResponse.json({ error: 'Panelist not found' }, { status: 404 })
      }

      // Upsert qualification
      const { data: qualification, error } = await supabase
        .from('survey_qualifications')
        .upsert({
          survey_id: survey_id,
          panelist_id: panelist_id,
          is_qualified: is_qualified,
        }, {
          onConflict: 'survey_id,panelist_id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating qualification:', error)
        return NextResponse.json({ error: 'Failed to create qualification' }, { status: 500 })
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_activity_type: 'qualification_updated',
        p_description: `${is_qualified ? 'Qualified' : 'Disqualified'} panelist for survey: ${survey.title}`,
        p_metadata: { survey_id: survey_id, panelist_id: panelist_id, is_qualified }
      })

      return NextResponse.json(qualification, { status: 201 })
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in qualifications POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 