import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getS3Config } from '@/lib/s3-service'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Get S3 configuration
    const s3Config = getS3Config()
    
    // Check environment variables
    const envVars = {
      S3_REGION: process.env.S3_REGION,
      S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
      S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
      S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET',
    }
    
    return NextResponse.json({
      s3Config,
      envVars,
      message: 'S3 configuration test'
    })
    
  } catch (error) {
    console.error('Error in S3 config test:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 