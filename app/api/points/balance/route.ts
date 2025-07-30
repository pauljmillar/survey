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
    const user = await requireAuth('view_own_profile')

    // Get panelist profile with points information
    const { data: profile, error } = await supabase
      .from('panelist_profiles')
      .select(`
        points_balance,
        total_points_earned,
        total_points_redeemed,
        is_active,
        updated_at
      `)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Panelist profile not found' }, { status: 404 })
      }
      console.error('Error fetching points balance:', error)
      return NextResponse.json({ error: 'Failed to fetch points balance' }, { status: 500 })
    }

    if (!profile.is_active) {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 })
    }

    return NextResponse.json({
      points_balance: profile.points_balance,
      total_points_earned: profile.total_points_earned,
      total_points_redeemed: profile.total_points_redeemed,
      last_updated: profile.updated_at,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in points balance API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 