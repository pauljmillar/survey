import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth'
import { generateSignedUrl, objectExists, getS3Config } from '@/lib/s3-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Get user role for permission checking
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'system_admin' && userData?.role !== 'survey_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get S3 configuration
    const s3Config = getS3Config()
    
    // Get sample mail packages with s3_key values
    const { data: mailPackages, error } = await supabase
      .from('mail_packages')
      .select('id, s3_key, total_images, created_at')
      .not('s3_key', 'is', null)
      .limit(5)

    if (error) {
      console.error('Error fetching mail packages:', error)
      return NextResponse.json({ error: 'Failed to fetch mail packages' }, { status: 500 })
    }

    // Test each s3_key
    const testResults = []
    
    for (const pkg of mailPackages || []) {
      const s3Key = pkg.s3_key
      
      try {
        // Check if object exists
        const exists = await objectExists(s3Key)
        
        // Generate signed URL
        const signedUrl = await generateSignedUrl(s3Key, 3600)
        
        testResults.push({
          packageId: pkg.id,
          s3Key,
          objectExists: exists,
          signedUrl,
          totalImages: pkg.total_images,
          createdAt: pkg.created_at
        })
        
        console.log(`S3 Test for package ${pkg.id}:`, {
          s3Key,
          exists,
          signedUrl: signedUrl.substring(0, 100) + '...'
        })
        
      } catch (error) {
        testResults.push({
          packageId: pkg.id,
          s3Key,
          objectExists: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          totalImages: pkg.total_images,
          createdAt: pkg.created_at
        })
        
        console.error(`S3 Test failed for package ${pkg.id}:`, error)
      }
    }

    return NextResponse.json({
      s3Config,
      testResults,
      summary: {
        totalPackages: mailPackages?.length || 0,
        packagesWithS3Key: testResults.length,
        successfulTests: testResults.filter(r => r.objectExists).length,
        failedTests: testResults.filter(r => !r.objectExists).length
      }
    })
    
  } catch (error) {
    console.error('Error in debug S3 URLs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 