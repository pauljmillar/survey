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

    // Get scans for the last 14 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 13) // 14 days including today

    console.log('Fetching scans from:', startDate.toISOString(), 'to:', endDate.toISOString())

    // Get mail_packages data (this is where most scans come from)
    const { data: mailPackages, error: mailError } = await supabase
      .from('mail_packages')
      .select('created_at, total_images')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (mailError) {
      console.error('Error fetching mail packages:', mailError)
      return NextResponse.json({ error: 'Failed to fetch mail package data' }, { status: 500 })
    }

    console.log('Mail packages found:', mailPackages?.length || 0)
    console.log('Sample mail packages:', mailPackages?.slice(0, 3))

    // Get scan_sessions data
    const { data: scanSessions, error: sessionError } = await supabase
      .from('scan_sessions')
      .select('created_at, total_scans')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (sessionError) {
      console.error('Error fetching scan sessions:', sessionError)
      return NextResponse.json({ error: 'Failed to fetch scan session data' }, { status: 500 })
    }

    console.log('Scan sessions found:', scanSessions?.length || 0)
    console.log('Sample scan sessions:', scanSessions?.slice(0, 3))

    // Group by date and sum scans
    const dailyScans: { [key: string]: number } = {}
    
    // Initialize all 14 days with 0
    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      dailyScans[dateKey] = 0
    }

    // Add mail package data
    mailPackages?.forEach(pkg => {
      const dateKey = new Date(pkg.created_at).toISOString().split('T')[0]
      if (dailyScans[dateKey] !== undefined) {
        dailyScans[dateKey] += pkg.total_images || 0
      }
    })

    // Add scan session data
    scanSessions?.forEach(session => {
      const dateKey = new Date(session.created_at).toISOString().split('T')[0]
      if (dailyScans[dateKey] !== undefined) {
        dailyScans[dateKey] += session.total_scans || 0
      }
    })

    console.log('Daily scans object:', dailyScans)

    // Convert to array format for chart
    const chartData = Object.entries(dailyScans).map(([date, scans]) => ({
      date,
      scans
    }))

    console.log('Final chart data:', chartData)

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Error fetching daily scans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 