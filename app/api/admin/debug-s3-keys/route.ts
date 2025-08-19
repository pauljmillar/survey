import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()
    
    // Get all s3_key values from mail_packages
    const { data, error } = await supabase
      .from('mail_packages')
      .select('id, s3_key, created_at')
      .not('s3_key', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('Error fetching s3_keys:', error)
      return NextResponse.json({ error: 'Failed to fetch s3_keys' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      s3Keys: data,
      totalCount: data?.length || 0
    })
    
  } catch (error) {
    console.error('Debug S3 Keys - Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 