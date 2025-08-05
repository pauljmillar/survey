import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'
import { currentUser } from '@clerk/nextjs/server'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth('manage_panelists')

    // Get all panelists with their user data
    const { data: panelists, error } = await supabase
      .from('panelist_profiles')
      .select(`
        id,
        user_id,
        points_balance,
        total_points_earned,
        total_points_redeemed,
        is_active,
        created_at,
        updated_at,
        profile_data,
        users!inner(
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching panelists:', error)
      return NextResponse.json({ error: 'Failed to fetch panelists' }, { status: 500 })
    }

    // Transform the data to match our interface
    // Note: first_name and last_name come from Clerk, not our database
    const transformedPanelists = panelists?.map(panelist => {
      // Try to get name from profile_data first, fallback to email-based name
      const profileData = panelist.profile_data as any || {}
      const firstName = profileData.first_name || 'Panelist'
      const lastName = profileData.last_name || `#${panelist.id.slice(0, 8)}`
      
      return {
        id: panelist.id,
        user_id: panelist.user_id,
        email: panelist.users?.email || '',
        first_name: firstName,
        last_name: lastName,
        points_balance: panelist.points_balance || 0,
        total_points_earned: panelist.total_points_earned || 0,
        total_points_redeemed: panelist.total_points_redeemed || 0,
        surveys_completed: Math.floor((panelist.total_points_earned || 0) / 100),
        is_active: panelist.is_active || false,
        created_at: panelist.created_at,
        last_activity: panelist.updated_at || panelist.created_at,
        profile_data: panelist.profile_data
      }
    }) || []

    return NextResponse.json({ 
      panelists: transformedPanelists,
      total: transformedPanelists.length
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in panelists API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 