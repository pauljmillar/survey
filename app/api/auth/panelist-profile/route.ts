import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get panelist profile
    const { data: profile, error } = await supabase
      .from('panelist_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
      console.error('Error fetching panelist profile:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error in panelist-profile API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a panelist
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (!user || user.role !== 'panelist') {
      return NextResponse.json({ error: 'Only panelists can have profiles' }, { status: 403 })
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('panelist_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingProfile) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 409 })
    }

    const { profileData } = await request.json()

    // Create new panelist profile
    const { data: profile, error } = await supabase
      .from('panelist_profiles')
      .insert({
        user_id: userId,
        points_balance: 0,
        total_points_earned: 0,
        total_points_redeemed: 0,
        profile_data: profileData || {},
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating panelist profile:', error)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    return NextResponse.json(profile, { status: 201 })
  } catch (error) {
    console.error('Error in panelist-profile POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { profileData } = await request.json()

    // Update panelist profile
    const { data: profile, error } = await supabase
      .from('panelist_profiles')
      .update({ 
        profile_data: profileData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating panelist profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error in panelist-profile PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 