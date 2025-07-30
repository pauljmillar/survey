import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const createOfferSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  points_required: z.number().min(1),
  merchant_name: z.string().min(1).max(255),
  offer_details: z.record(z.any()).optional(),
  is_active: z.boolean().optional(),
})

const updateOfferSchema = createOfferSchema.partial()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('active')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const minPoints = searchParams.get('min_points')
    const maxPoints = searchParams.get('max_points')

    // Build query for offers
    let query = supabase
      .from('merchant_offers')
      .select(`
        id,
        title,
        description,
        points_required,
        merchant_name,
        offer_details,
        is_active,
        created_at,
        updated_at
      `)
      .range(offset, offset + limit - 1)
      .order('points_required', { ascending: true })

    // Filter by active status (default to true for public access)
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    } else {
      query = query.eq('is_active', true)
    }

    // Filter by points range
    if (minPoints) {
      query = query.gte('points_required', parseInt(minPoints))
    }
    if (maxPoints) {
      query = query.lte('points_required', parseInt(maxPoints))
    }

    const { data: offers, error } = await query

    if (error) {
      console.error('Error fetching offers:', error)
      return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
    }

    return NextResponse.json({ 
      offers: offers || [], 
      total: offers?.length || 0 
    })
  } catch (error) {
    console.error('Error in offers GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth('manage_offers')
    const body = await request.json()

    // Validate request body
    const validation = createOfferSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const offerData = validation.data

    // Create offer
    const { data: offer, error } = await supabase
      .from('merchant_offers')
      .insert({
        title: offerData.title,
        description: offerData.description,
        points_required: offerData.points_required,
        merchant_name: offerData.merchant_name,
        offer_details: offerData.offer_details || {},
        is_active: offerData.is_active !== false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating offer:', error)
      return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 })
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_activity_type: 'offer_created',
      p_description: `Created merchant offer: ${offer.title}`,
      p_metadata: { offer_id: offer.id }
    })

    return NextResponse.json(offer, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in offers POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth('manage_offers')
    const { searchParams } = new URL(request.url)
    const offerId = searchParams.get('id')

    if (!offerId) {
      return NextResponse.json({ error: 'Offer ID required' }, { status: 400 })
    }

    const body = await request.json()

    // Validate request body
    const validation = updateOfferSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const updates = validation.data

    // Check if offer exists
    const { data: existingOffer } = await supabase
      .from('merchant_offers')
      .select('title')
      .eq('id', offerId)
      .single()

    if (!existingOffer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    // Update offer
    const { data: offer, error } = await supabase
      .from('merchant_offers')
      .update(updates)
      .eq('id', offerId)
      .select()
      .single()

    if (error) {
      console.error('Error updating offer:', error)
      return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 })
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_activity_type: 'offer_updated',
      p_description: `Updated merchant offer: ${offer.title}`,
      p_metadata: { offer_id: offer.id, updates }
    })

    return NextResponse.json(offer)
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in offers PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth('manage_offers')
    const { searchParams } = new URL(request.url)
    const offerId = searchParams.get('id')

    if (!offerId) {
      return NextResponse.json({ error: 'Offer ID required' }, { status: 400 })
    }

    // Check if offer exists
    const { data: existingOffer } = await supabase
      .from('merchant_offers')
      .select('title')
      .eq('id', offerId)
      .single()

    if (!existingOffer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    // Delete offer
    const { error } = await supabase
      .from('merchant_offers')
      .delete()
      .eq('id', offerId)

    if (error) {
      console.error('Error deleting offer:', error)
      return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 })
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_activity_type: 'offer_deleted',
      p_description: `Deleted merchant offer: ${existingOffer.title}`,
      p_metadata: { offer_id: offerId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in offers DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 