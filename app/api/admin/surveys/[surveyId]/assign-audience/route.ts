import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { filterAudience } from '@/lib/audience-filter'

export async function POST(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const user = await requireAuth('manage_qualifications')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { audience_preset_id, program } = body

    if (!audience_preset_id || !program) {
      return NextResponse.json({ 
        error: 'Audience preset ID and program are required' 
      }, { status: 400 })
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get the audience preset
    const { data: preset, error: presetError } = await supabase
      .from('audience_presets')
      .select('*')
      .eq('id', audience_preset_id)
      .single()

    if (presetError || !preset) {
      return NextResponse.json({ error: 'Audience preset not found' }, { status: 404 })
    }

    // Get the survey
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', params.surveyId)
      .single()

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    // Apply the filter criteria to get panelist IDs
    let panelistIds: string[] = []
    try {
      const filterData = await filterAudience({
        program,
        ...preset.filter_criteria
      })
      panelistIds = filterData.panelist_ids || []
    } catch (filterError) {
      return NextResponse.json({ 
        error: `Failed to apply audience filters: ${filterError instanceof Error ? filterError.message : 'Unknown error'}` 
      }, { status: 500 })
    }

    if (panelistIds.length === 0) {
      return NextResponse.json({ 
        error: 'No panelists match the audience criteria' 
      }, { status: 400 })
    }

    // Clear existing qualifications for this survey
    const { error: deleteError } = await supabase
      .from('survey_qualifications')
      .delete()
      .eq('survey_id', params.surveyId)

    if (deleteError) {
      console.error('Error clearing existing qualifications:', deleteError)
      return NextResponse.json({ error: 'Failed to clear existing qualifications' }, { status: 500 })
    }

    // Insert new qualifications
    const qualifications = panelistIds.map((panelistId: string) => ({
      survey_id: params.surveyId,
      panelist_id: panelistId,
      is_qualified: true
    }))

    const { error: insertError } = await supabase
      .from('survey_qualifications')
      .insert(qualifications)

    if (insertError) {
      console.error('Error inserting qualifications:', insertError)
      return NextResponse.json({ error: 'Failed to assign survey to audience' }, { status: 500 })
    }

    // Update survey audience count
    const { error: updateError } = await supabase
      .from('surveys')
      .update({ audience_count: panelistIds.length })
      .eq('id', params.surveyId)

    if (updateError) {
      console.error('Error updating survey audience count:', updateError)
      // Don't fail the whole operation for this
    }

    // Create survey audience assignment record
    const { error: assignmentError } = await supabase
      .from('survey_audience_assignments')
      .insert({
        survey_id: params.surveyId,
        audience_preset_id,
        assigned_by: user.id,
        assignment_metadata: {
          panelist_count: panelistIds.length,
          program,
          assigned_at: new Date().toISOString()
        }
      })

    if (assignmentError) {
      console.error('Error creating assignment record:', assignmentError)
      // Don't fail the whole operation for this
    }

    return NextResponse.json({
      success: true,
      survey_id: params.surveyId,
      audience_preset_id,
      panelist_count: panelistIds.length,
      message: `Survey assigned to ${panelistIds.length} panelists`
    })
  } catch (error) {
    console.error('Error in survey assignment API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 