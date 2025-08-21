import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Validate and set region with better error handling
const region = process.env.S3_REGION || 'us-west-2'

// Debug logging to see what's happening
console.log('S3 Configuration Debug:', {
  S3_REGION_env: process.env.S3_REGION,
  region_final: region,
  bucketName: process.env.S3_BUCKET_NAME || 'andyscan',
  hasAccessKey: !!process.env.S3_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.S3_SECRET_ACCESS_KEY
})

// Validate region
if (!region || region === 'undefined' || region === 'null' || region.trim() === '') {
  console.error('❌ Invalid S3_REGION:', process.env.S3_REGION)
  throw new Error(`S3_REGION environment variable is invalid: "${process.env.S3_REGION}"`)
}

// Initialize S3 client with credentials
const s3ClientConfig: any = {
  region: region,
}

// Only add explicit credentials if they are provided
if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
  s3ClientConfig.credentials = {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  }
}

console.log('✅ S3 Client Config:', {
  region: s3ClientConfig.region,
  hasCredentials: !!s3ClientConfig.credentials
})

const s3Client = new S3Client(s3ClientConfig)

const bucketName = process.env.S3_BUCKET_NAME || 'andyscan'

/**
 * Generate a signed URL for an S3 object
 * This allows secure access to private S3 objects without making them public
 */
export async function generateSignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
  try {
    if (!s3Key) {
      throw new Error('S3 key is required')
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })
    
    console.log('Generated signed URL for:', s3Key, 'URL:', signedUrl)
    
    return signedUrl
  } catch (error) {
    console.error('Error generating signed URL for', s3Key, ':', error)
    throw error
  }
}

/**
 * Check if an S3 object exists
 */
export async function objectExists(s3Key: string): Promise<boolean> {
  try {
    if (!s3Key) {
      return false
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    })

    await s3Client.send(command)
    return true
  } catch (error) {
    console.error('Error checking if object exists:', s3Key, error)
    return false
  }
}

/**
 * Get S3 configuration for debugging
 */
export function getS3Config() {
  return {
    bucketName,
    region: process.env.S3_REGION || 'us-west-2',
    hasAccessKey: !!process.env.S3_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.S3_SECRET_ACCESS_KEY,
  }
} 