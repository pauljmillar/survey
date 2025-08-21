import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Get user role for permission checking
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'system_admin' && userData?.role !== 'survey_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get total surveys completed
    const { count: totalSurveysCompleted } = await supabase
      .from('survey_completions')
      .select('*', { count: 'exact', head: true })

    // Get total users (panelists)
    const { count: totalUsers } = await supabase
      .from('panelist_profiles')
      .select('*', { count: 'exact', head: true })

    // Get total points awarded
    const { data: totalPointsResult } = await supabase
      .from('point_ledger')
      .select('points')
      .gte('points', 0)

    const totalPointsAwarded = totalPointsResult?.reduce((sum, entry) => sum + entry.points, 0) || 0

    // Get total scans
    const { data: totalScansResult } = await supabase
      .from('panelist_profiles')
      .select('total_scans')

    const totalScans = totalScansResult?.reduce((sum, profile) => sum + (profile.total_scans || 0), 0) || 0

    return NextResponse.json({
      totalSurveysCompleted: totalSurveysCompleted || 0,
      totalUsers: totalUsers || 0,
      totalPointsAwarded,
      totalScans
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 