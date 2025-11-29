'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

interface ContestFormData {
  title: string
  description: string
  start_date: string
  end_date: string
  prize_points: number
  invite_type: 'all_panelists' | 'selected_panelists'
  panelist_ids: string[]
}

interface ContestFormProps {
  contestId?: string
  onSuccess?: () => void
}

export function ContestForm({ contestId, onSuccess }: ContestFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ContestFormData>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    prize_points: 100,
    invite_type: 'all_panelists',
    panelist_ids: []
  })
  const [selectedPanelists, setSelectedPanelists] = useState<string[]>([])
  const [availablePanelists, setAvailablePanelists] = useState<any[]>([])

  useEffect(() => {
    fetchPanelists()
    if (contestId) {
      fetchContest()
    }
  }, [contestId])

  // Helper function to convert UTC to Chicago time for datetime-local input
  // datetime-local inputs work in the browser's local timezone, but we want to show Chicago time
  const utcToChicago = (utcDateString: string): string => {
    const date = new Date(utcDateString)
    // Use Intl.DateTimeFormat to format in Chicago timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    const parts = formatter.formatToParts(date)
    const year = parts.find(p => p.type === 'year')?.value
    const month = parts.find(p => p.type === 'month')?.value
    const day = parts.find(p => p.type === 'day')?.value
    const hour = parts.find(p => p.type === 'hour')?.value
    const minute = parts.find(p => p.type === 'minute')?.value
    
    return `${year}-${month}-${day}T${hour}:${minute}`
  }

  // Helper function to convert datetime-local value (interpreted as Chicago time) to UTC
  // The datetime-local input gives a value without timezone info
  // We interpret it as Chicago time and convert to UTC
  const chicagoToUTC = (chicagoDateString: string): string => {
    if (!chicagoDateString) return new Date().toISOString()
    
    // Parse input: YYYY-MM-DDTHH:mm (interpreted as Chicago time)
    const [datePart, timePart] = chicagoDateString.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute] = timePart.split(':').map(Number)
    
    // Method: We need to find the UTC time that, when displayed in Chicago, shows as this time
    // We'll use an iterative approach that converges quickly
    
    // Start with an estimate: Chicago is typically UTC-6 (CST) or UTC-5 (CDT)
    // Average is about UTC-5.5, so start with adding 6 hours to get UTC
    let testUTC = new Date(Date.UTC(year, month - 1, day, hour + 6, minute, 0))
    
    // Refine iteratively (usually converges in 1-2 iterations)
    for (let i = 0; i < 5; i++) {
      const chicagoDisplay = utcToChicago(testUTC.toISOString())
      
      if (chicagoDisplay === chicagoDateString) {
        return testUTC.toISOString()
      }
      
      // Calculate difference
      const [targetDate, targetTime] = chicagoDateString.split('T')
      const [displayDate, displayTime] = chicagoDisplay.split('T')
      
      if (targetDate !== displayDate || targetTime !== displayTime) {
        // Parse both to calculate exact difference
        const [targetY, targetM, targetD] = targetDate.split('-').map(Number)
        const [targetH, targetMin] = targetTime.split(':').map(Number)
        const [displayY, displayM, displayD] = displayDate.split('-').map(Number)
        const [displayH, displayMin] = displayTime.split(':').map(Number)
        
        // Calculate difference in milliseconds
        // Create UTC dates for comparison (timezone-agnostic)
        const targetUTC = Date.UTC(targetY, targetM - 1, targetD, targetH, targetMin, 0)
        const displayUTC = Date.UTC(displayY, displayM - 1, displayD, displayH, displayMin, 0)
        const diffMs = targetUTC - displayUTC
        
        // Adjust
        testUTC = new Date(testUTC.getTime() + diffMs)
      } else {
        break
      }
    }
    
    return testUTC.toISOString()
  }

  const fetchContest = async () => {
    try {
      const response = await fetch(`/api/admin/contests/${contestId}`)
      if (response.ok) {
        const data = await response.json()
        const contest = data.contest
        setFormData({
          title: contest.title || '',
          description: contest.description || '',
          start_date: contest.start_date ? utcToChicago(contest.start_date) : '',
          end_date: contest.end_date ? utcToChicago(contest.end_date) : '',
          prize_points: contest.prize_points || 100,
          invite_type: contest.invite_type || 'all_panelists',
          panelist_ids: []
        })
        
        // If selected_panelists, fetch invitations
        if (contest.invite_type === 'selected_panelists') {
          // Fetch invitations would require a new endpoint or include in contest details
          // For now, we'll just set the invite type and let admin re-select
        }
      }
    } catch (error) {
      console.error('Error fetching contest:', error)
    }
  }

  const fetchPanelists = async () => {
    try {
      const response = await fetch('/api/admin/panelists')
      if (response.ok) {
        const data = await response.json()
        setAvailablePanelists(data.panelists || [])
      }
    } catch (error) {
      console.error('Error fetching panelists:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate dates
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      
      if (endDate <= startDate) {
        setError('End date must be after start date')
        setLoading(false)
        return
      }

      // Convert Chicago datetime-local to UTC
      const startDateUTC = chicagoToUTC(formData.start_date)
      const endDateUTC = chicagoToUTC(formData.end_date)

      const payload: any = {
        title: formData.title,
        description: formData.description,
        start_date: startDateUTC,
        end_date: endDateUTC,
        prize_points: formData.prize_points,
        invite_type: formData.invite_type
      }

      if (formData.invite_type === 'selected_panelists') {
        if (selectedPanelists.length === 0) {
          setError('Please select at least one panelist')
          setLoading(false)
          return
        }
        payload.panelist_ids = selectedPanelists
      }

      const url = contestId ? `/api/admin/contests/${contestId}` : '/api/admin/contests'
      const method = contestId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/admin/contests')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save contest')
      }
    } catch (error) {
      console.error('Error saving contest:', error)
      setError('An error occurred while saving the contest')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contest Details</CardTitle>
          <CardDescription>Enter the basic information for the contest</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Summer Points Challenge"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Earn the most points this summer and win!"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date * (Chicago Time)</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Enter time in Chicago timezone (CST/CDT)</p>
            </div>

            <div>
              <Label htmlFor="end_date">End Date * (Chicago Time)</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Enter time in Chicago timezone (CST/CDT)</p>
            </div>
          </div>

          <div>
            <Label htmlFor="prize_points">Prize Points *</Label>
            <Input
              id="prize_points"
              type="number"
              min="1"
              value={formData.prize_points}
              onChange={(e) => setFormData({ ...formData, prize_points: parseInt(e.target.value) || 0 })}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitation Settings</CardTitle>
          <CardDescription>Choose who can participate in this contest</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="invite_type">Invite Type *</Label>
            <Select
              value={formData.invite_type}
              onValueChange={(value: 'all_panelists' | 'selected_panelists') =>
                setFormData({ ...formData, invite_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_panelists">All Panelists</SelectItem>
                <SelectItem value="selected_panelists">Select Panelists</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.invite_type === 'selected_panelists' && (
            <div>
              <Label>Select Panelists *</Label>
              <div className="mt-2 border rounded-md p-4 max-h-60 overflow-y-auto">
                {availablePanelists.map((panelist) => (
                  <label key={panelist.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                    <input
                      type="checkbox"
                      checked={selectedPanelists.includes(panelist.user_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPanelists([...selectedPanelists, panelist.user_id])
                        } else {
                          setSelectedPanelists(selectedPanelists.filter(id => id !== panelist.user_id))
                        }
                      }}
                    />
                    <span className="text-sm">
                      {panelist.first_name} {panelist.last_name} ({panelist.email})
                    </span>
                  </label>
                ))}
              </div>
              {selectedPanelists.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedPanelists.length} panelist(s) selected
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : contestId ? 'Update Contest' : 'Create Contest'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/contests')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

