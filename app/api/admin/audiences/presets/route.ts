import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth('manage_panelists')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: presets, error } = await supabase
      .from('audience_presets')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching audience presets:', error)
      return NextResponse.json({ error: 'Failed to fetch audience presets' }, { status: 500 })
    }

    return NextResponse.json({ presets })
  } catch (error) {
    console.error('Error in audience presets API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth('manage_panelists')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, filter_criteria, audience_count } = body

    // Validate required fields
    if (!name || !filter_criteria || typeof audience_count !== 'number') {
      return NextResponse.json({ 
        error: 'Name, filter criteria, and audience count are required' 
      }, { status: 400 })
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: preset, error } = await supabase
      .from('audience_presets')
      .insert({
        name,
        description: description || null,
        filter_criteria,
        audience_count,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating audience preset:', error)
      return NextResponse.json({ error: 'Failed to create audience preset' }, { status: 500 })
    }

    return NextResponse.json({ preset }, { status: 201 })
  } catch (error) {
    console.error('Error in audience presets API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 