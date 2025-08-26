import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { objectExists, generateSignedUrl } from '@/lib/s3-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Require authentication
    await requireAuth()
    
    const { key } = params
    
    if (!key) {
      return NextResponse.json({ error: 'Missing image key' }, { status: 400 })
    }
    
    // Decode the URL-encoded key
    const decodedKey = decodeURIComponent(key)
    
    console.log('Test S3 Image - Testing key:', decodedKey)
    
    // Test with and without .jpg extension
    const testKeys = [
      decodedKey,
      `${decodedKey}.jpg`,
      `${decodedKey}.jpeg`,
      `${decodedKey}.png`
    ]
    
    const results = []
    
    for (const testKey of testKeys) {
      try {
        const exists = await objectExists(testKey)
        let signedUrl = null
        
        if (exists) {
          signedUrl = await generateSignedUrl(testKey, 3600)
        }
        
        results.push({
          key: testKey,
          exists,
          signedUrl: signedUrl ? signedUrl.substring(0, 100) + '...' : null
        })
        
        console.log(`Test result for ${testKey}:`, { exists, hasSignedUrl: !!signedUrl })
        
      } catch (error) {
        results.push({
          key: testKey,
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        console.error(`Test failed for ${testKey}:`, error)
      }
    }
    
    return NextResponse.json({
      originalKey: decodedKey,
      testResults: results,
      workingKeys: results.filter(r => r.exists).map(r => r.key)
    })
    
  } catch (error) {
    console.error('Test S3 Image - Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
