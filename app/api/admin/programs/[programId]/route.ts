import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export async function GET(
  request: NextRequest,
  { params }: { params: { programId: string } }
) {
  try {
    const user = await requireAuth('manage_programs')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: program, error } = await supabase
      .from('panelist_programs')
      .select('*')
      .eq('id', params.programId)
      .single()

    if (error) {
      console.error('Error fetching program:', error)
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    return NextResponse.json({ program })
  } catch (error) {
    console.error('Error in program API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { programId: string } }
) {
  try {
    const user = await requireAuth('manage_programs')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { display_name, description, is_active } = body

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: program, error } = await supabase
      .from('panelist_programs')
      .update({
        display_name,
        description: description || null,
        is_active: is_active !== undefined ? is_active : true
      })
      .eq('id', params.programId)
      .select()
      .single()

    if (error) {
      console.error('Error updating program:', error)
      return NextResponse.json({ error: 'Failed to update program' }, { status: 500 })
    }

    return NextResponse.json({ program })
  } catch (error) {
    console.error('Error in program API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { programId: string } }
) {
  try {
    const user = await requireAuth('manage_programs')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Soft delete by setting is_active to false
    const { data: program, error } = await supabase
      .from('panelist_programs')
      .update({ is_active: false })
      .eq('id', params.programId)
      .select()
      .single()

    if (error) {
      console.error('Error deactivating program:', error)
      return NextResponse.json({ error: 'Failed to deactivate program' }, { status: 500 })
    }

    return NextResponse.json({ program })
  } catch (error) {
    console.error('Error in program API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 