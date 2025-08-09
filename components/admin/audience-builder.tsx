'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Users, Target } from 'lucide-react'

interface Program {
  id: string
  name: string
  display_name: string
  description: string
}

export function AudienceBuilder() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [audienceCount, setAudienceCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/admin/programs')
      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs || [])
        // Only set default if we have programs and no selection yet
        if (data.programs?.length > 0 && !selectedProgram) {
          setSelectedProgram(data.programs[0].name)
        }
      } else {
        setError('Failed to load programs')
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
      setError('Failed to load programs')
    }
  }

  const filterAudience = async () => {
    if (!selectedProgram) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/audiences/filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: {
            program: selectedProgram
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAudienceCount(data.audience_count || 0)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to calculate audience')
      }
    } catch (error) {
      console.error('Error filtering audience:', error)
      setError('Failed to calculate audience')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Audience Builder
        </CardTitle>
        <CardDescription>
          Create targeted audiences for your surveys
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Program</label>
            <Select
              value={selectedProgram}
              onValueChange={setSelectedProgram}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map(program => (
                  <SelectItem 
                    key={program.id} 
                    value={program.name || 'default'}
                  >
                    {program.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={filterAudience} 
            disabled={loading || !selectedProgram}
          >
            {loading ? 'Calculating...' : 'Calculate Audience Size'}
          </Button>

          {audienceCount > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-lg font-semibold">
                  {audienceCount.toLocaleString()} panelists
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}