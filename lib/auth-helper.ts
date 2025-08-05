import { headers } from 'next/headers'

export async function getUserIdFromHeaders(): Promise<string | null> {
  try {
    const headersList = await headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null
    }
    
    // For now, we'll use a simple approach
    // In a real implementation, you'd verify the JWT token
    // For development, we can extract user ID from the token or use a different approach
    
    // Since Clerk is causing issues, let's try a different approach
    // We'll check for a custom header that might be set by the client
    const userId = headersList.get('x-user-id')
    
    if (userId) {
      return userId
    }
    
    return null
  } catch (error) {
    console.error('Error getting user ID from headers:', error)
    return null
  }
} 