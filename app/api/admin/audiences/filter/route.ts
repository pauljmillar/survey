import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { filterAudience } from '@/lib/audience-filter'

interface FilterCriteria {
  program: string
  gender?: string
  age_range?: [number, number]
  income_range?: [number, number]
  location?: string[]
  interests?: string[]
  education_level?: string
  employment_status?: string
  household_size?: [number, number]
  children_under_18?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth('manage_panelists')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const filters: FilterCriteria = body.filters

    // Validate required program filter
    if (!filters.program) {
      return NextResponse.json({ error: 'Program filter is required' }, { status: 400 })
    }

    const result = await filterAudience(filters)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in audience filter API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 