import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get panelist profile
    const { data: profile, error: profileError } = await supabase
      .from('panelist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Panelist profile not found' }, { status: 404 })
    }

    // Get all available programs
    const { data: programs, error: programsError } = await supabase
      .from('panelist_programs')
      .select('*')
      .eq('is_active', true)
      .order('display_name')

    if (programsError) {
      console.error('Error fetching programs:', programsError)
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
    }

    // Get panelist's current opt-ins
    const { data: optIns, error: optInsError } = await supabase
      .from('panelist_program_opt_ins')
      .select('program_id, is_active, opted_in_at')
      .eq('panelist_id', profile.id)

    if (optInsError) {
      console.error('Error fetching opt-ins:', optInsError)
      return NextResponse.json({ error: 'Failed to fetch program preferences' }, { status: 500 })
    }

    // Create a map of program opt-ins
    const optInMap = new Map()
    optIns?.forEach(optIn => {
      optInMap.set(optIn.program_id, optIn)
    })

    // Combine programs with opt-in status
    const programsWithStatus = programs?.map(program => ({
      ...program,
      is_opted_in: optInMap.has(program.id) ? optInMap.get(program.id).is_active : false,
      opted_in_at: optInMap.has(program.id) ? optInMap.get(program.id).opted_in_at : null
    }))

    return NextResponse.json({ programs: programsWithStatus })
  } catch (error) {
    console.error('Error in panelist programs API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { program_name, opt_in } = body

    if (!program_name || typeof opt_in !== 'boolean') {
      return NextResponse.json({ error: 'Program name and opt_in status are required' }, { status: 400 })
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get panelist profile
    const { data: profile, error: profileError } = await supabase
      .from('panelist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Panelist profile not found' }, { status: 404 })
    }

    // Get program ID
    const { data: program, error: programError } = await supabase
      .from('panelist_programs')
      .select('id')
      .eq('name', program_name)
      .eq('is_active', true)
      .single()

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found or inactive' }, { status: 404 })
    }

    // Check if opt-in already exists
    const { data: existingOptIn, error: existingError } = await supabase
      .from('panelist_program_opt_ins')
      .select('id, is_active')
      .eq('panelist_id', profile.id)
      .eq('program_id', program.id)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing opt-in:', existingError)
      return NextResponse.json({ error: 'Failed to update program preference' }, { status: 500 })
    }

    let result
    if (existingOptIn) {
      // Update existing opt-in
      const { data: updatedOptIn, error: updateError } = await supabase
        .from('panelist_program_opt_ins')
        .update({
          is_active: opt_in,
          opted_out_at: opt_in ? null : new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingOptIn.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating opt-in:', updateError)
        return NextResponse.json({ error: 'Failed to update program preference' }, { status: 500 })
      }

      result = updatedOptIn
    } else {
      // Create new opt-in
      const { data: newOptIn, error: insertError } = await supabase
        .from('panelist_program_opt_ins')
        .insert({
          panelist_id: profile.id,
          program_id: program.id,
          is_active: opt_in,
          opted_out_at: opt_in ? null : new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating opt-in:', insertError)
        return NextResponse.json({ error: 'Failed to update program preference' }, { status: 500 })
      }

      result = newOptIn
    }

    return NextResponse.json({ 
      success: true, 
      program_name,
      opt_in,
      opt_in_record: result
    })
  } catch (error) {
    console.error('Error in panelist programs API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 