import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { generateSignedUrl, objectExists, getS3Config } from '@/lib/s3-service'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()
    
    const s3Config = getS3Config()
    
    // Test with a sample s3_key if available
    let testResult = null
    try {
      const testKey = '20250818_082603_1.jpg' // Sample key from your data
      const exists = await objectExists(testKey)
      const signedUrl = await generateSignedUrl(testKey, 3600)
      
      testResult = {
        testKey,
        objectExists: exists,
        signedUrl: signedUrl.substring(0, 100) + '...',
        success: exists
      }
    } catch (error) {
      testResult = {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }
    }
    
    return NextResponse.json({
      s3Config,
      testResult,
      message: 'S3 configuration test'
    })
    
  } catch (error) {
    console.error('Error in S3 config test:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 