'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { Settings, ArrowRight } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { userRole } = useAuth()

  // Redirect to settings after a brief moment
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/settings')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  if (userRole !== 'panelist') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Admin Profile</h2>
            <p className="text-muted-foreground mb-6">
              Profile management is available for panelists only.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="p-8 max-w-md text-center">
        <div className="flex justify-center mb-4">
          <Settings className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold mb-4">Profile Moved to Settings</h2>
        <p className="text-muted-foreground mb-6">
          Profile management has been moved to the Settings page for a better experience.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          You will be redirected automatically in a few seconds...
        </p>
        <Button onClick={() => router.push('/settings')} className="w-full">
          <Settings className="w-4 h-4 mr-2" />
          Go to Settings
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Card>
    </div>
  )
} 