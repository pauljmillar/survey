import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

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

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Build the query using proper JOIN syntax
    // First, get the program ID for the selected program
    const { data: program, error: programError } = await supabase
      .from('panelist_programs')
      .select('id')
      .eq('name', filters.program)
      .eq('is_active', true)
      .single()

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Now get panelists who are opted into this program
    let query = supabase
      .from('panelist_profiles')
      .select(`
        id,
        user_id,
        points_balance,
        total_points_earned,
        total_points_redeemed,
        surveys_completed,
        profile_data,
        is_active,
        panelist_program_opt_ins!inner(
          program_id,
          is_active
        )
      `)
      .eq('is_active', true)
      .eq('panelist_program_opt_ins.program_id', program.id)
      .eq('panelist_program_opt_ins.is_active', true)

    // Apply demographic filters
    if (filters.gender) {
      query = query.eq('profile_data->gender', filters.gender)
    }

    if (filters.age_range) {
      query = query.gte('profile_data->age', filters.age_range[0])
      query = query.lte('profile_data->age', filters.age_range[1])
    }

    if (filters.income_range) {
      query = query.gte('profile_data->income', filters.income_range[0])
      query = query.lte('profile_data->income', filters.income_range[1])
    }

    if (filters.location && filters.location.length > 0) {
      query = query.in('profile_data->location->country', filters.location)
    }

    if (filters.interests && filters.interests.length > 0) {
      // Check if any of the interests are in the profile_data->interests array
      filters.interests.forEach(interest => {
        query = query.contains('profile_data->interests', [interest])
      })
    }

    if (filters.education_level) {
      query = query.eq('profile_data->education_level', filters.education_level)
    }

    if (filters.employment_status) {
      query = query.eq('profile_data->employment_status', filters.employment_status)
    }

    if (filters.household_size) {
      query = query.gte('profile_data->household_size', filters.household_size[0])
      query = query.lte('profile_data->household_size', filters.household_size[1])
    }

    if (filters.children_under_18 !== undefined) {
      query = query.eq('profile_data->children_under_18', filters.children_under_18)
    }

    const { data: panelists, error } = await query

    if (error) {
      console.error('Error filtering panelists:', error)
      return NextResponse.json({ error: 'Failed to filter panelists' }, { status: 500 })
    }

    // Extract panelist IDs for survey qualification
    const panelistIds = panelists?.map(p => p.id) || []

    // Get total count of all panelists for comparison
    const { count: totalPanelists } = await supabase
      .from('panelist_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get count of panelists in the selected program
    const { count: programPanelists } = await supabase
      .from('panelist_program_opt_ins')
      .select('panelist_id', { count: 'exact', head: true })
      .eq('program_id', program.id)
      .eq('is_active', true)

    return NextResponse.json({
      audience_count: panelistIds.length,
      panelist_ids: panelistIds,
      filter_summary: {
        total_panelists: totalPanelists || 0,
        program_panelists: programPanelists || 0,
        filtered_count: panelistIds.length,
        filter_criteria: filters,
        applied_filters: Object.keys(filters).filter(key => 
          key !== 'program' && filters[key as keyof FilterCriteria] !== undefined
        )
      }
    })
  } catch (error) {
    console.error('Error in audience filter API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 