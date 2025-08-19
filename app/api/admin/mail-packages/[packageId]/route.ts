import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { packageId: string } }
) {
  try {
    const user = await requireAuth()
    
    const { data, error } = await supabase
      .from('mail_packages')
      .select(`
        *,
        panelist_profiles!inner(
          id,
          user_id,
          profile_data
        ),
        mail_scans(
          id,
          image_filename,
          s3_key,
          file_size_bytes,
          image_sequence,
          industry,
          mail_type,
          brand_name,
          scan_status,
          scan_date,
          processing_notes
        )
      `)
      .eq('id', params.packageId)
      .single()
    
    if (error) {
      console.error('Error fetching mail package:', error)
      return NextResponse.json({ error: 'Mail package not found' }, { status: 404 })
    }
    
    return NextResponse.json({ data })
    
  } catch (error) {
    console.error('Error in mail package API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { packageId: string } }
) {
  try {
    const user = await requireAuth()
    
    const body = await request.json()
    const { status, points_awarded, is_approved, processing_notes } = body
    
    const updateData: any = {}
    
    if (status !== undefined) updateData.status = status
    if (points_awarded !== undefined) updateData.points_awarded = points_awarded
    if (is_approved !== undefined) updateData.is_approved = is_approved
    if (processing_notes !== undefined) updateData.processing_notes = processing_notes
    if (is_approved !== undefined) {
      updateData.reviewed_by = userId
    }
    
    const { data, error } = await supabase
      .from('mail_packages')
      .update(updateData)
      .eq('id', params.packageId)
      .select(`
        *,
        panelist_profiles!inner(
          id,
          user_id,
          profile_data
        ),
        mail_scans(
          id,
          image_filename,
          s3_key,
          file_size_bytes,
          image_sequence,
          industry,
          mail_type,
          brand_name,
          scan_status,
          scan_date,
          processing_notes
        )
      `)
      .single()
    
    if (error) {
      console.error('Error updating mail package:', error)
      return NextResponse.json({ error: 'Failed to update mail package' }, { status: 500 })
    }
    
    // If points are awarded, update panelist's points balance
    if (points_awarded && points_awarded > 0) {
      // First get the current points balance
      const { data: currentProfile, error: fetchError } = await supabase
        .from('panelist_profiles')
        .select('points_balance')
        .eq('id', data.panelist_id)
        .single()
      
      if (fetchError) {
        console.error('Error fetching current points balance:', fetchError)
      } else {
        // Then update with the new balance
        const newBalance = (currentProfile.points_balance || 0) + points_awarded
        const { error: pointsError } = await supabase
          .from('panelist_profiles')
          .update({
            points_balance: newBalance
          })
          .eq('id', data.panelist_id)
        
        if (pointsError) {
          console.error('Error updating panelist points:', pointsError)
          // Don't fail the request, just log the error
        }
      }
    }
    
    return NextResponse.json({ data })
    
  } catch (error) {
    console.error('Error in mail package API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { packageId: string } }
) {
  try {
    const user = await requireAuth()
    
    const { error } = await supabase
      .from('mail_packages')
      .delete()
      .eq('id', params.packageId)
    
    if (error) {
      console.error('Error deleting mail package:', error)
      return NextResponse.json({ error: 'Failed to delete mail package' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error in mail package API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 