import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getS3Config, objectExists } from '@/lib/s3-service'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()
    
    // Get S3 configuration
    const config = getS3Config()
    
    // Test if we can access a known object
    const testKey = '20250818_082603_1.jpg'
    const exists = await objectExists(testKey)
    
    return NextResponse.json({
      success: true,
      config,
      testObject: {
        key: testKey,
        exists
      },
      environment: {
        hasS3BucketName: !!process.env.S3_BUCKET_NAME,
        hasS3Region: !!process.env.S3_REGION,
        hasS3AccessKey: !!process.env.S3_ACCESS_KEY_ID,
        hasS3SecretKey: !!process.env.S3_SECRET_ACCESS_KEY,
      }
    })
    
  } catch (error) {
    console.error('S3 Test - Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      config: getS3Config()
    }, { status: 500 })
  }
} 