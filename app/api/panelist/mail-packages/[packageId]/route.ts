import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { packageId: string } }
) {
  try {
    // Require panelist authentication
    const user = await requireAuth('update_mail_packages')
    
    const body = await request.json()
    const { 
      brand_name, 
      industry, 
      company_validated, 
      response_intention, 
      name_check, 
      notes, 
      status, 
      is_approved, 
      processing_notes 
    } = body
    
    // Validate status if provided
    if (status && !['pending', 'incomplete', 'processing', 'completed', 'rejected'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: pending, incomplete, processing, completed, rejected' 
      }, { status: 400 })
    }
    
    // Validate response_intention if provided (common values)
    if (response_intention && !['interested', 'not_interested', 'neutral', 'maybe'].includes(response_intention)) {
      console.warn(`Unusual response_intention value: ${response_intention}`)
    }
    
    // Validate name_check if provided (common values)
    if (name_check && !['verified', 'unverified', 'pending', 'failed'].includes(name_check)) {
      console.warn(`Unusual name_check value: ${name_check}`)
    }
    
    // Build update data object with only provided fields
    const updateData: any = {}
    if (brand_name !== undefined) updateData.brand_name = brand_name
    if (industry !== undefined) updateData.industry = industry
    if (company_validated !== undefined) updateData.company_validated = company_validated
    if (response_intention !== undefined) updateData.response_intention = response_intention
    if (name_check !== undefined) updateData.name_check = name_check
    if (notes !== undefined) updateData.notes = notes
    if (status !== undefined) updateData.status = status
    if (is_approved !== undefined) updateData.is_approved = is_approved
    if (processing_notes !== undefined) updateData.processing_notes = processing_notes
    
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()
    
    // First, verify the mail package belongs to the authenticated panelist
    const { data: existingPackage, error: fetchError } = await supabase
      .from('mail_packages')
      .select('id, panelist_id')
      .eq('id', params.packageId)
      .single()
    
    if (fetchError || !existingPackage) {
      return NextResponse.json({ error: 'Mail package not found' }, { status: 404 })
    }
    
    // Get panelist profile to verify ownership
    const { data: profile, error: profileError } = await supabase
      .from('panelist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Panelist profile not found' }, { status: 404 })
    }
    
    // Verify the mail package belongs to this panelist
    if (existingPackage.panelist_id !== profile.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Update the mail package
    const { data: updatedPackage, error: updateError } = await supabase
      .from('mail_packages')
      .update(updateData)
      .eq('id', params.packageId)
      .select(`
        id,
        panelist_id,
        brand_name,
        industry,
        company_validated,
        response_intention,
        name_check,
        notes,
        status,
        is_approved,
        processing_notes,
        created_at,
        updated_at
      `)
      .single()
    
    if (updateError) {
      console.error('Error updating mail package:', updateError)
      return NextResponse.json({ error: 'Failed to update mail package' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      mail_package: updatedPackage
    })
    
  } catch (error) {
    console.error('Error in mail package PATCH API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
