import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const user = await requireAuth('manage_qualifications')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignmentId } = await params

    // Get the assignment details first
    const { data: assignment, error: fetchError } = await supabase
      .from('survey_audience_assignments')
      .select('survey_id, assignment_metadata')
      .eq('id', assignmentId)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Delete the assignment record
    const { error: deleteError } = await supabase
      .from('survey_audience_assignments')
      .delete()
      .eq('id', assignmentId)

    if (deleteError) {
      console.error('Error deleting assignment:', deleteError)
      return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
    }

    // Clear the survey qualifications for this survey
    // (This removes the survey from the assigned panelists)
    const { error: clearError } = await supabase
      .from('survey_qualifications')
      .delete()
      .eq('survey_id', assignment.survey_id)

    if (clearError) {
      console.error('Error clearing qualifications:', clearError)
      // Don't fail the operation for this, just log it
    }

    // Reset the survey's audience count
    const { error: updateError } = await supabase
      .from('surveys')
      .update({ audience_count: 0 })
      .eq('id', assignment.survey_id)

    if (updateError) {
      console.error('Error updating audience count:', updateError)
      // Don't fail the operation for this, just log it
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Assignment deleted successfully' 
    })
  } catch (error) {
    console.error('Error in delete assignment API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}