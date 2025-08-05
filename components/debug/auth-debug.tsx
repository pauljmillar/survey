'use client'

import { useAuth } from '@/hooks/use-auth'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function AuthDebug() {
  const { user, userRole, loading, isSignedIn, error } = useAuth()
  const [profileStatus, setProfileStatus] = useState<string>('checking')
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    if (isSignedIn && user) {
      checkProfileStatus()
    }
  }, [isSignedIn, user])

  const checkProfileStatus = async () => {
    try {
      const response = await fetch('/api/auth/panelist-profile')
      if (response.ok) {
        setProfileStatus('exists')
      } else if (response.status === 404) {
        setProfileStatus('missing')
      } else {
        setProfileStatus('error')
      }
    } catch (error) {
      setProfileStatus('error')
    }
  }

  const refreshDebugInfo = async () => {
    const info = {
      user: user,
      userRole: userRole,
      isSignedIn: isSignedIn,
      loading: loading,
      error: error,
      profileStatus: profileStatus,
      timestamp: new Date().toISOString()
    }
    setDebugInfo(info)
  }

  useEffect(() => {
    refreshDebugInfo()
  }, [user, userRole, isSignedIn, loading, error, profileStatus])

  if (!isSignedIn) {
    return (
      <Card className="p-4 m-4">
        <h3 className="font-semibold mb-2">Auth Debug - Not Signed In</h3>
        <p className="text-sm text-gray-600">User is not authenticated</p>
      </Card>
    )
  }

  return (
    <Card className="p-4 m-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Auth Debug Info</h3>
        <Button size="sm" onClick={refreshDebugInfo}>
          Refresh
        </Button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div><strong>User ID:</strong> {user?.id || 'N/A'}</div>
        <div><strong>User Role:</strong> {userRole || 'N/A'}</div>
        <div><strong>Is Signed In:</strong> {isSignedIn ? 'Yes' : 'No'}</div>
        <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
        <div><strong>Profile Status:</strong> {profileStatus}</div>
        {error && <div><strong>Error:</strong> {error}</div>}
        <div><strong>Last Updated:</strong> {debugInfo.timestamp}</div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <h4 className="font-medium mb-2">Actions</h4>
        <div className="space-x-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => window.location.href = '/onboarding'}
          >
            Go to Onboarding
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </Card>
  )
} 