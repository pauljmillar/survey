'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Program {
  id: string
  name: string
  display_name: string
  description: string
  is_active: boolean
  is_opted_in?: boolean
  opted_in_at?: string | null
}

export function ProgramPreferences() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

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
      setError('Failed to load program preferences')
    } finally {
      setLoading(false)
    }
  }

  const handleProgramToggle = async (programName: string, optIn: boolean) => {
    try {
      setUpdating(programName)
      
      const response = await fetch('/api/panelist/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          program_name: programName,
          opt_in: optIn
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update program preference')
      }

      // Update local state
      setPrograms(prev => prev.map(program => 
        program.name === programName 
          ? { ...program, is_opted_in: optIn }
          : program
      ))
    } catch (error) {
      console.error('Error updating program preference:', error)
      setError('Failed to update program preference')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Research Programs</CardTitle>
          <CardDescription>
            Choose which types of research opportunities you&apos;d like to participate in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-4 w-4" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Error Loading Programs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchPrograms} variant="outline">
            Try Again
          </Button>
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
            <CardDescription>
              Choose which types of research opportunities you&apos;d like to participate in
            </CardDescription>
          </div>
          <Badge variant="outline">
            {activePrograms.length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Programs */}
        {activePrograms.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Active Programs ({activePrograms.length})
            </h3>
            <div className="space-y-3">
              {activePrograms.map(program => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  onToggle={handleProgramToggle}
                  updating={updating === program.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Available Programs */}
        {inactivePrograms.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Available Programs ({inactivePrograms.length})
            </h3>
            <div className="space-y-3">
              {inactivePrograms.map(program => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  onToggle={handleProgramToggle}
                  updating={updating === program.name}
                />
              ))}
            </div>
          </div>
        )}

        {programs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No programs available at the moment.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ProgramCardProps {
  program: Program
  onToggle: (programName: string, optIn: boolean) => void
  updating: boolean
}

function ProgramCard({ program, onToggle, updating }: ProgramCardProps) {
  const handleToggle = () => {
    if (!updating) {
      onToggle(program.name, !program.is_opted_in)
    }
  }

  return (
    <div className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-medium">{program.display_name}</h4>
          {program.is_opted_in && (
            <Badge variant="default" className="text-xs">
              Active
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          {program.description}
        </p>
        {program.is_opted_in && program.opted_in_at && (
          <p className="text-xs text-muted-foreground">
            Joined {new Date(program.opted_in_at).toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          checked={program.is_opted_in || false}
          onCheckedChange={handleToggle}
          disabled={updating}
        />
        {updating && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        )}
      </div>
    </div>
  )
} 