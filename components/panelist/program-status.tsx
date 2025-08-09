'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, Settings } from 'lucide-react'
import Link from 'next/link'

interface Program {
  id: string
  name: string
  display_name: string
  description: string
  is_active: boolean
  is_opted_in?: boolean
  opted_in_at?: string | null
}

export function ProgramStatus() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/panelist/programs')
      
      if (!response.ok) {
        throw new Error('Failed to fetch programs')
      }
      
      const data = await response.json()
      setPrograms(data.programs || [])
    } catch (error) {
      console.error('Error fetching programs:', error)
      setError('Failed to load program status')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Research Programs</CardTitle>
          <CardDescription>Your current program participation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Research Programs</CardTitle>
          <CardDescription>Your current program participation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  const activePrograms = programs.filter(p => p.is_opted_in)
  const inactivePrograms = programs.filter(p => !p.is_opted_in)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Research Programs</CardTitle>
            <CardDescription>Your current program participation</CardDescription>
          </div>
          <Link href="/profile">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activePrograms.map(program => (
            <div key={program.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-sm font-medium">{program.display_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Active since {program.opted_in_at ? new Date(program.opted_in_at).toLocaleDateString() : 'recently'}
                  </div>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500">
                Active
              </Badge>
            </div>
          ))}

          {inactivePrograms.slice(0, 2).map(program => (
            <div key={program.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{program.display_name}</div>
                  <div className="text-xs text-muted-foreground">Not participating</div>
                </div>
              </div>
              <Badge variant="outline">
                Available
              </Badge>
            </div>
          ))}

          {programs.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No programs available</p>
            </div>
          )}

          {programs.length > 0 && (
            <div className="pt-2">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="w-full">
                  View All Programs
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}