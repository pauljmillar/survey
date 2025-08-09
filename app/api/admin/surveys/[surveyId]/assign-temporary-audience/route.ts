import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const user = await requireAuth('manage_qualifications')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { surveyId } = await params
    const body = await request.json()
    const { program, filters } = body

    if (!program || !filters) {
      return NextResponse.json({ 
        error: 'Program and filters are required' 
      }, { status: 400 })
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get the survey
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single()

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    // Apply the filter criteria to get panelist IDs
    const filterResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/audiences/filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.id}` // This is a simplified approach
      },
      body: JSON.stringify({
        filters
      })
    })

    if (!filterResponse.ok) {
      const filterError = await filterResponse.json()
      return NextResponse.json({ 
        error: `Failed to filter audience: ${filterError.error}` 
      }, { status: 400 })
    }

    const filterData = await filterResponse.json()
    const panelistIds = filterData.panelist_ids || []

    if (panelistIds.length === 0) {
      return NextResponse.json({ 
        error: 'No panelists match the filter criteria' 
      }, { status: 400 })
    }

    // Clear existing qualifications for this survey
    const { error: deleteError } = await supabase
      .from('survey_qualifications')
      .delete()
      .eq('survey_id', surveyId)

    if (deleteError) {
      console.error('Error clearing qualifications:', deleteError)
      return NextResponse.json({ error: 'Failed to clear existing qualifications' }, { status: 500 })
    }

    // Insert new qualifications
    const qualifications = panelistIds.map((panelistId: string) => ({
      survey_id: surveyId,
      panelist_id: panelistId,
      is_qualified: true,
      qualification_reason: 'Audience filter assignment'
    }))

    const { error: insertError } = await supabase
      .from('survey_qualifications')
      .insert(qualifications)

    if (insertError) {
      console.error('Error inserting qualifications:', insertError)
      return NextResponse.json({ error: 'Failed to assign survey' }, { status: 500 })
    }

    // Update the survey's audience count
    const { error: updateError } = await supabase
      .from('surveys')
      .update({ audience_count: panelistIds.length })
      .eq('id', surveyId)

    if (updateError) {
      console.error('Error updating audience count:', updateError)
      // Don't fail the whole operation for this
    }

    // Create assignment record for tracking
    const { error: assignmentError } = await supabase
      .from('survey_audience_assignments')
      .insert({
        survey_id: surveyId,
        audience_preset_id: null, // No preset, this is a temporary assignment
        assigned_by: user.id,
        assignment_metadata: {
          panelist_count: panelistIds.length,
          program,
          filters,
          assigned_at: new Date().toISOString(),
          assignment_type: 'temporary'
        }
      })

    if (assignmentError) {
      console.error('Error creating assignment record:', assignmentError)
      // Don't fail the whole operation for this
    }

    return NextResponse.json({
      success: true,
      survey_id: surveyId,
      panelist_count: panelistIds.length,
      message: `Survey assigned to ${panelistIds.length} panelists`
    })
  } catch (error) {
    console.error('Error in temporary survey assignment API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}