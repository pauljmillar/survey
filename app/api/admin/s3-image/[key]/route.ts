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
    
    console.log('S3 Image Proxy - Generated signed URL:', signedUrl)
    
    // Redirect to the signed URL instead of proxying the content
    // This is more efficient and allows the browser to cache the image
    return NextResponse.redirect(signedUrl)
    
  } catch (error) {
    console.error('S3 Image Proxy - Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 