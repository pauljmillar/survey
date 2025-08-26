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
    
    // Get a sample mail package with its scans
    const { data: mailPackage, error } = await supabase
      .from('mail_packages')
      .select(`
        id,
        s3_key,
        mail_scans(
          id,
          s3_key,
          image_filename,
          image_sequence
        )
      `)
      .not('s3_key', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      console.error('Error fetching mail package:', error)
      return NextResponse.json({ error: 'Failed to fetch mail package' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      mailPackage: {
        id: mailPackage.id,
        s3_key: mailPackage.s3_key,
        scanCount: mailPackage.mail_scans?.length || 0,
        scans: mailPackage.mail_scans?.map(scan => ({
          id: scan.id,
          s3_key: scan.s3_key,
          image_filename: scan.image_filename,
          image_sequence: scan.image_sequence
        })) || []
      }
    })
    
  } catch (error) {
    console.error('Debug Detail Images - Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
