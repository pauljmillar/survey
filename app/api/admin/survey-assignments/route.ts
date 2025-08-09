import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth('manage_qualifications')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch survey assignments with related data
    const { data: assignments, error } = await supabase
      .from('survey_audience_assignments')
      .select(`
        id,
        survey_id,
        audience_preset_id,
        assigned_by,
        assigned_at,
        assignment_metadata,
        surveys!inner(title),
        audience_presets(name)
      `)
      .order('assigned_at', { ascending: false })

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    // Transform the data for easier consumption
    const transformedAssignments = assignments?.map(assignment => ({
      id: assignment.id,
      survey_id: assignment.survey_id,
      survey_title: assignment.surveys?.title,
      audience_preset_id: assignment.audience_preset_id,
      audience_preset_name: assignment.audience_presets?.name,
      assigned_by: assignment.assigned_by,
      assigned_at: assignment.assigned_at,
      assignment_metadata: assignment.assignment_metadata
    })) || []

    return NextResponse.json({ assignments: transformedAssignments })
  } catch (error) {
    console.error('Error in survey assignments API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}