import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { generateSignedUrl, objectExists } from '@/lib/s3-service'

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
    
    console.log('S3 Image Proxy - Requesting signed URL for:', decodedKey)
    
    // Check if object exists first
    const exists = await objectExists(decodedKey)
    if (!exists) {
      console.error('S3 Image Proxy - Object does not exist:', decodedKey)
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }
    
    // Generate a signed URL for the S3 object
    const signedUrl = await generateSignedUrl(decodedKey, 3600) // 1 hour expiry
    
    console.log('S3 Image Proxy - Generated signed URL, fetching image data')
    
    // Fetch the image data from S3
    const imageResponse = await fetch(signedUrl)
    
    if (!imageResponse.ok) {
      console.error('S3 Image Proxy - Failed to fetch image from S3:', imageResponse.status)
      return NextResponse.json({ error: 'Failed to fetch image from S3' }, { status: 500 })
    }
    
    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
    
    console.log('S3 Image Proxy - Successfully fetched image, size:', imageBuffer.byteLength, 'bytes')
    
    // Return the image data with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Length': imageBuffer.byteLength.toString(),
      },
    })
    
  } catch (error) {
    console.error('S3 Image Proxy - Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 