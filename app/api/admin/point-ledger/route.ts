import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { currentUser } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const transactionType = searchParams.get('transactionType') || ''
    const panelistId = searchParams.get('panelistId') || ''
    
    const offset = (page - 1) * limit
    
    // Build the query - use a simpler approach without foreign key joins
    let query = supabase
      .from('point_ledger')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%`)
    }
    
    if (transactionType && transactionType !== 'all') {
      query = query.eq('transaction_type', transactionType)
    }
    
    if (panelistId && panelistId !== 'all') {
      query = query.eq('panelist_id', panelistId)
    }
    
    // Get paginated results
    const { data: ledgerEntries, error } = await query
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('Error fetching point ledger:', error)
      return NextResponse.json({ error: 'Failed to fetch point ledger' }, { status: 500 })
    }
    
    // Get total count for pagination
    let countQuery = supabase
      .from('point_ledger')
      .select('id', { count: 'exact', head: true })
    
    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%`)
    }
    
    if (transactionType && transactionType !== 'all') {
      countQuery = countQuery.eq('transaction_type', transactionType)
    }
    
    if (panelistId && panelistId !== 'all') {
      countQuery = countQuery.eq('panelist_id', panelistId)
    }
    
    const { count, error: countError } = await countQuery
    
    if (countError) {
      console.error('Error counting point ledger:', countError)
      return NextResponse.json({ error: 'Failed to count point ledger' }, { status: 500 })
    }
    
    return NextResponse.json({
      ledgerEntries: ledgerEntries || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
    
  } catch (error) {
    console.error('Point Ledger API - Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const body = await request.json()
    const {
      panelistId,
      points,
      transactionType,
      title,
      description,
      metadata = {},
      effectiveDate
    } = body
    
    // Validate required fields
    if (!panelistId || !points || !transactionType || !title) {
      return NextResponse.json({ 
        error: 'Missing required fields: panelistId, points, transactionType, title' 
      }, { status: 400 })
    }
    
    if (points <= 0) {
      return NextResponse.json({ 
        error: 'Points must be positive' 
      }, { status: 400 })
    }
    
         // Use the award_points function to create the ledger entry
     const { data, error } = await supabase.rpc('award_points', {
       p_panelist_id: panelistId,
       p_points: points,
       p_transaction_type: transactionType,
       p_title: title,
       p_description: description || null,
       p_metadata: metadata,
       p_awarded_by: user.id,
       p_effective_date: effectiveDate || new Date().toISOString().split('T')[0]
     })
    
    if (error) {
      console.error('Error creating point ledger entry:', error)
      return NextResponse.json({ 
        error: error.message || 'Failed to create point ledger entry' 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      ledgerId: data
    })
    
  } catch (error) {
    console.error('Point Ledger API - Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 