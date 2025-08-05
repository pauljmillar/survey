import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth('manage_panelists')

    // Get all panelists with empty profile_data
    const { data: panelists, error } = await supabase
      .from('panelist_profiles')
      .select('id, profile_data')
      .eq('profile_data', '{}')

    if (error) {
      console.error('Error fetching panelists:', error)
      return NextResponse.json({ error: 'Failed to fetch panelists' }, { status: 500 })
    }

    let updatedCount = 0
    const sampleData = [
      {
        first_name: 'John',
        last_name: 'Smith',
        age: 28,
        gender: 'male',
        location: { country: 'United States', state: 'California', city: 'Los Angeles' },
        interests: ['Technology', 'Sports & Fitness', 'Entertainment'],
        demographics: { income_range: '50k_75k', education: 'bachelors', employment: 'employed' }
      },
      {
        first_name: 'Sarah',
        last_name: 'Johnson',
        age: 34,
        gender: 'female',
        location: { country: 'Canada', state: 'Ontario', city: 'Toronto' },
        interests: ['Health & Wellness', 'Food & Dining', 'Travel'],
        demographics: { income_range: '75k_100k', education: 'masters', employment: 'employed' }
      }
    ]

    // Update panelists with sample data
    for (let i = 0; i < (panelists || []).length; i++) {
      const panelist = panelists[i]
      const sampleProfile = sampleData[i % sampleData.length]
      
      const { error: updateError } = await supabase
        .from('panelist_profiles')
        .update({ profile_data: sampleProfile })
        .eq('id', panelist.id)

      if (updateError) {
        console.error(`Error updating panelist ${panelist.id}:`, updateError)
      } else {
        updatedCount++
      }
    }

    return NextResponse.json({ 
      message: `Updated ${updatedCount} panelists with sample data`,
      updatedCount
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in sample-data API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 