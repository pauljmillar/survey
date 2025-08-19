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
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const isApproved = searchParams.get('is_approved') || ''
    const sortBy = searchParams.get('sort_by') || 'submission_date'
    const sortOrder = searchParams.get('sort_order') || 'desc'
    
    const offset = (page - 1) * limit
    
         // Build query
     let query = supabase
       .from('mail_packages')
       .select(`
         *,
         panelist_profiles!inner(
           id,
           user_id,
           profile_data
         )
       `)
    
    // Add filters
    if (search) {
      query = query.or(`panelist_profiles.profile_data->>'first_name'.ilike.%${search}%,panelist_profiles.profile_data->>'last_name'.ilike.%${search}%`)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (isApproved !== '') {
      if (isApproved === 'true') {
        query = query.eq('is_approved', true)
      } else if (isApproved === 'false') {
        query = query.eq('is_approved', false)
      } else {
        query = query.is('is_approved', null)
      }
    }
    
    // Add sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Get total count for pagination
    let countQuery: any
    
    if (search) {
      // For search, we need to join with panelist_profiles
      countQuery = supabase
        .from('mail_packages')
        .select(`
          id,
          panelist_profiles!inner(
            id,
            profile_data
          )
        `, { count: 'exact', head: true })
        .or(`panelist_profiles.profile_data->>'first_name'.ilike.%${search}%,panelist_profiles.profile_data->>'last_name'.ilike.%${search}%`)
    } else {
      // Simple count query when no search
      countQuery = supabase
        .from('mail_packages')
        .select('id', { count: 'exact', head: true })
    }
    
    if (status) {
      countQuery = countQuery.eq('status', status)
    }
    
    if (isApproved !== '') {
      if (isApproved === 'true') {
        countQuery = countQuery.eq('is_approved', true)
      } else if (isApproved === 'false') {
        countQuery = countQuery.eq('is_approved', false)
      } else {
        countQuery = countQuery.is('is_approved', null)
      }
    }
    
    const [dataResult, countResult] = await Promise.all([
      query.range(offset, offset + limit - 1),
      countQuery
    ])
    
    if (dataResult.error) {
      console.error('Error fetching mail packages:', dataResult.error)
      return NextResponse.json({ error: 'Failed to fetch mail packages' }, { status: 500 })
    }
    
    if (countResult.error) {
      console.error('Error counting mail packages:', countResult.error)
      return NextResponse.json({ error: 'Failed to count mail packages' }, { status: 500 })
    }
    
    const totalCount = countResult.count || 0
    const totalPages = Math.ceil(totalCount / limit)
    
    return NextResponse.json({
      data: dataResult.data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
    
  } catch (error) {
    console.error('Error in mail packages API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    const body = await request.json()
    const { panelist_id, total_images, status = 'incomplete' } = body
    
    if (!panelist_id || !total_images) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('mail_packages')
      .insert({
        panelist_id,
        total_images,
        status
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating mail package:', error)
      return NextResponse.json({ error: 'Failed to create mail package' }, { status: 500 })
    }
    
    return NextResponse.json({ data })
    
  } catch (error) {
    console.error('Error in mail packages API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 