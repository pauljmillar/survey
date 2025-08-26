// S3 utility functions for mail scanning
// Updated to work with the andyscan bucket

export interface S3Config {
  bucketName: string
  region: string
  accessKeyId: string
  secretAccessKey: string
}

// S3 configuration for the andyscan bucket
export const s3Config: S3Config = {
  bucketName: process.env.S3_BUCKET_NAME || 'andyscan',
  region: process.env.S3_REGION || 'us-west-2',
  accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ''
}

export function getSignedUrl(s3Key: string, expiresIn: number = 3600): string {
  // For now, return a direct S3 URL - in production you'd want signed URLs
  return `https://${s3Config.bucketName}.s3.${s3Config.region}.amazonaws.com/${s3Key}`
}

export function getThumbnailUrl(s3Key: string, width: number = 100, height: number = 100): string {
  if (!s3Key) {
    return getPlaceholderImageUrl()
  }
  
  // Use our secure proxy API route that generates signed URLs
  const encodedKey = encodeURIComponent(s3Key)
  const proxyUrl = `/api/admin/s3-image/${encodedKey}`
  
  return proxyUrl
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Extract file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * Check if file is an image based on extension
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
  const extension = getFileExtension(filename)
  return imageExtensions.includes(extension)
}

export function getPlaceholderImageUrl(): string {
  // Return a reliable placeholder image for when no image is available
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0MFY0MEgyMFYyMFoiIGZpbGw9IiM5OTk5OTkiLz4KPHBhdGggZD0iTTI1IDI1SDM1VjM1SDI1VjI1WiIgZmlsbD0iI0Y1RjVGNSIvPgo8L3N2Zz4K'
}

export function getImageUrl(s3Key: string): string {
  if (!s3Key) {
    return getPlaceholderImageUrl()
  }
  
  // Use our secure proxy API route that generates signed URLs
  const encodedKey = encodeURIComponent(s3Key)
  return `/api/admin/s3-image/${encodedKey}`
} 