import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    
    // Build the query using the panelist_balances view
    let query = supabase
      .from('panelist_balances')
      .select('*')
      .order('current_balance', { ascending: false })
      .limit(limit)
    
    // Apply search filter
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    
    const { data: panelistBalances, error } = await query
    
    if (error) {
      console.error('Error fetching panelist balances:', error)
      return NextResponse.json({ error: 'Failed to fetch panelist balances' }, { status: 500 })
    }
    
    return NextResponse.json({
      panelistBalances: panelistBalances || []
    })
    
  } catch (error) {
    console.error('Panelist Balances API - Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 