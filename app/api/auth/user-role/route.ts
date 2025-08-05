import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get user ID from Clerk auth
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role from database
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('role, email, created_at')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user role:', error)
      return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 })
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      role: dbUser.role,
      email: dbUser.email,
      createdAt: dbUser.created_at
    })
  } catch (error) {
    console.error('Error in user-role API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user ID from Clerk auth
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await request.json()

    // Validate role
    const validRoles = ['panelist', 'survey_admin', 'system_admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if current user has permission to change roles
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (!currentUser || currentUser.role !== 'system_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Update user role
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user role:', error)
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
    }

    return NextResponse.json({ success: true, role })
  } catch (error) {
    console.error('Error in user-role PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 