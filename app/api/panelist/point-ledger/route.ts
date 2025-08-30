import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Require authentication - panelists can only view their own ledger
    const user = await requireAuth('view_own_profile')
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const transactionType = searchParams.get('transactionType') || ''
    
    // Validate limit to prevent abuse
    if (limit > 100) {
      return NextResponse.json({ error: 'Limit cannot exceed 100' }, { status: 400 })
    }
    
    // Build query for point ledger entries
    let query = supabase
      .from('point_ledger')
      .select(`
        points,
        transaction_type,
        title,
        description,
        created_at
      `)
      .eq('panelist_id', user.id)
      .order('created_at', { ascending: false })
    
    // Apply transaction type filter if specified
    if (transactionType && transactionType !== 'all') {
      query = query.eq('transaction_type', transactionType)
    }
    
    // Apply pagination
    const { data: ledgerEntries, error } = await query
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('Error fetching point ledger:', error)
      return NextResponse.json({ error: 'Failed to fetch point ledger' }, { status: 500 })
    }
    
    // Get total count for pagination info
    let countQuery = supabase
      .from('point_ledger')
      .select('id', { count: 'exact', head: true })
      .eq('panelist_id', user.id)
    
    if (transactionType && transactionType !== 'all') {
      countQuery = countQuery.eq('transaction_type', transactionType)
    }
    
    const { count, error: countError } = await countQuery
    
    if (countError) {
      console.error('Error counting point ledger:', countError)
      // Don't fail the request if count fails, just return without pagination info
    }
    
    return NextResponse.json({
      ledgerEntries: ledgerEntries || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      }
    })
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in panelist point ledger API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
