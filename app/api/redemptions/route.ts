import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const createRedemptionSchema = z.object({
  offer_id: z.string().uuid(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth('view_own_profile')
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')

    // Get panelist profile
    const { data: profile } = await supabase
      .from('panelist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Panelist profile not found' }, { status: 404 })
    }

    // Build query for redemptions
    let query = supabase
      .from('redemptions')
      .select(`
        id,
        points_spent,
        status,
        redemption_date,
        created_at,
        merchant_offers (
          id,
          title,
          description,
          merchant_name,
          offer_details
        )
      `)
      .eq('panelist_id', profile.id)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: redemptions, error } = await query

    if (error) {
      console.error('Error fetching redemptions:', error)
      return NextResponse.json({ error: 'Failed to fetch redemptions' }, { status: 500 })
    }

    return NextResponse.json({ 
      redemptions: redemptions || [], 
      total: redemptions?.length || 0 
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in redemptions GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth('redeem_points')
    const body = await request.json()

    // Validate request body
    const validation = createRedemptionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { offer_id } = validation.data

    // Get panelist profile
    const { data: profile } = await supabase
      .from('panelist_profiles')
      .select('id, points_balance')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Panelist profile not found' }, { status: 404 })
    }

    // Get offer details
    const { data: offer } = await supabase
      .from('merchant_offers')
      .select('id, title, points_required, is_active')
      .eq('id', offer_id)
      .single()

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    if (!offer.is_active) {
      return NextResponse.json({ error: 'Offer is not active' }, { status: 400 })
    }

    // Check if user has sufficient points
    if (profile.points_balance < offer.points_required) {
      return NextResponse.json({ 
        error: 'Insufficient points balance',
        required: offer.points_required,
        available: profile.points_balance
      }, { status: 400 })
    }

    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from('redemptions')
      .insert({
        panelist_id: profile.id,
        offer_id: offer.id,
        points_spent: offer.points_required,
        status: 'pending',
      })
      .select()
      .single()

    if (redemptionError) {
      console.error('Error creating redemption:', redemptionError)
      return NextResponse.json({ error: 'Failed to create redemption' }, { status: 500 })
    }

    // Redeem points through the ledger system
    try {
      const { data: ledgerEntry, error: ledgerError } = await supabase.rpc('redeem_points', {
        p_panelist_id: user.id,
        p_points: offer.points_required,
        p_title: `Redemption: ${offer.title}`,
        p_transaction_type: 'redemption',
        p_description: `Redeemed offer for ${offer.points_required} points`,
        p_metadata: { 
          offer_id: offer.id,
          redemption_id: redemption.id
        }
      })

      if (ledgerError) {
        console.error('Error creating ledger entry:', ledgerError)
        // Rollback redemption if points deduction fails
        await supabase.from('redemptions').delete().eq('id', redemption.id)
        return NextResponse.json({ error: 'Failed to process redemption' }, { status: 500 })
      }
    } catch (ledgerError) {
      console.error('Error in ledger transaction:', ledgerError)
      // Rollback redemption
      await supabase.from('redemptions').delete().eq('id', redemption.id)
      return NextResponse.json({ error: 'Failed to process point deduction' }, { status: 500 })
    }

    // Get updated profile to return current balance
    const { data: updatedProfile } = await supabase
      .from('panelist_profiles')
      .select('points_balance, total_points_redeemed')
      .eq('id', profile.id)
      .single()

    // Update redemption status to completed
    await supabase
      .from('redemptions')
      .update({ status: 'completed' })
      .eq('id', redemption.id)

    return NextResponse.json({
      success: true,
      redemption_id: redemption.id,
      points_spent: offer.points_required,
      new_balance: updatedProfile?.points_balance || 0,
      total_redeemed: updatedProfile?.total_points_redeemed || 0,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in redemptions POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 