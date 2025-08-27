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
    const { 
      status, 
      points_awarded, 
      is_approved, 
      processing_notes,
      industry,
      brand_name,
      company_validated,
      response_intention,
      name_check
    } = body
    
    const updateData: any = {}
    
    if (status !== undefined) updateData.status = status
    if (points_awarded !== undefined) updateData.points_awarded = points_awarded
    if (is_approved !== undefined) updateData.is_approved = is_approved
    if (processing_notes !== undefined) updateData.processing_notes = processing_notes
    if (industry !== undefined) updateData.industry = industry
    if (brand_name !== undefined) updateData.brand_name = brand_name
    if (company_validated !== undefined) updateData.company_validated = company_validated
    if (response_intention !== undefined) updateData.response_intention = response_intention
    if (name_check !== undefined) updateData.name_check = name_check
    if (is_approved !== undefined) {
      updateData.reviewed_by = user.id
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
    
    // If points are awarded, create a ledger entry
    if (points_awarded && points_awarded > 0) {
      try {
        const { data: ledgerEntry, error: ledgerError } = await supabase.rpc('award_points', {
          p_panelist_id: data.panelist_id,
          p_points: points_awarded,
          p_transaction_type: 'manual_award',
          p_title: `Mail package approval: ${data.package_name || 'Package'}`,
          p_description: `Points awarded for approved mail package`,
          p_metadata: { 
            mail_package_id: params.packageId,
            package_name: data.package_name
          },
          p_awarded_by: user.id
        })

        if (ledgerError) {
          console.error('Error creating ledger entry for mail package points:', ledgerError)
          // Don't fail the request, just log the error
        }
      } catch (ledgerError) {
        console.error('Error in ledger transaction for mail package:', ledgerError)
        // Don't fail the request, just log the error
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