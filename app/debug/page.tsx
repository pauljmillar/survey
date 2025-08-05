'use client'

import { AuthDebug } from '@/components/debug/auth-debug'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'

export default function DebugPage() {
  const { user, userRole, loading, isSignedIn } = useAuth()
  const [testResults, setTestResults] = useState<any>({})

  const runTests = async () => {
    const results: any = {}

    // Test 1: Check user role API
    try {
      const roleResponse = await fetch('/api/auth/user-role')
      results.userRole = {
        status: roleResponse.status,
        ok: roleResponse.ok,
        data: roleResponse.ok ? await roleResponse.json() : null
      }
    } catch (error) {
      results.userRole = { error: error instanceof Error ? error.message : 'Unknown error' }
    }

    // Test 2: Check panelist profile API
    try {
      const profileResponse = await fetch('/api/auth/panelist-profile')
      results.panelistProfile = {
        status: profileResponse.status,
        ok: profileResponse.ok,
        data: profileResponse.ok ? await profileResponse.json() : null
      }
    } catch (error) {
      results.panelistProfile = { error: error instanceof Error ? error.message : 'Unknown error' }
    }

    setTestResults(results)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Page</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <AuthDebug />
          </div>
          
          <div>
            <Card className="p-4">
              <h3 className="font-semibold mb-4">API Tests</h3>
              <Button onClick={runTests} className="mb-4">
                Run Tests
              </Button>
              
              {Object.keys(testResults).length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">User Role API</h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded">
                      {JSON.stringify(testResults.userRole, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Panelist Profile API</h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded">
                      {JSON.stringify(testResults.panelistProfile, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        <div className="mt-6">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-x-2">
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/onboarding'}
              >
                Go to Onboarding
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                Go to Home
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 