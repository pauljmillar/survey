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
    
    // Get s3_key values from mail_packages
    const { data: mailPackages, error: packagesError } = await supabase
      .from('mail_packages')
      .select('id, s3_key, created_at')
      .not('s3_key', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (packagesError) {
      console.error('Error fetching mail_packages s3_keys:', packagesError)
      return NextResponse.json({ error: 'Failed to fetch mail_packages s3_keys' }, { status: 500 })
    }
    
    // Get s3_key values from mail_scans for comparison
    const { data: mailScans, error: scansError } = await supabase
      .from('mail_scans')
      .select('id, mailpack_id, s3_key, image_filename, image_sequence, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (scansError) {
      console.error('Error fetching mail_scans s3_keys:', scansError)
      return NextResponse.json({ error: 'Failed to fetch mail_scans s3_keys' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      mailPackages: mailPackages,
      mailScans: mailScans,
      summary: {
        packagesWithS3Key: mailPackages?.length || 0,
        scansWithS3Key: mailScans?.length || 0,
        samplePackageKeys: mailPackages?.slice(0, 3).map(p => p.s3_key) || [],
        sampleScanKeys: mailScans?.slice(0, 3).map(s => s.s3_key) || []
      }
    })
    
  } catch (error) {
    console.error('Debug S3 Keys - Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 