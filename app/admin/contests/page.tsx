'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Trophy, Users } from 'lucide-react'

interface Contest {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  prize_points: number
  status: 'draft' | 'active' | 'ended' | 'cancelled'
  invite_type: 'all_panelists' | 'selected_panelists'
  created_at: string
  participant_count: number
}

export default function ContestsPage() {
  const router = useRouter()
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchContests()
  }, [statusFilter])

  const fetchContests = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/contests?status=${statusFilter === 'all' ? '' : statusFilter}`)
      
      if (response.ok) {
        const data = await response.json()
        setContests(data.contests || [])
      } else {
        console.error('Failed to fetch contests')
      }
    } catch (error) {
      console.error('Error fetching contests:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: 'secondary',
      active: 'default',
      ended: 'outline',
      cancelled: 'destructive'
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Chicago'
    })
  }

  const handleStartContest = async (contestId: string) => {
    if (!confirm('Start this contest? It will become active and visible to panelists.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/contests/${contestId}/start`, {
        method: 'POST'
      })
      
      if (response.ok) {
        fetchContests() // Refresh the list
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to start contest')
      }
    } catch (error) {
      console.error('Error starting contest:', error)
      alert('Error starting contest')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contest Management</h1>
            <p className="text-muted-foreground">Create and manage contests for panelists</p>
          </div>
          <Button onClick={() => router.push('/admin/contests/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Contest
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </Card>

        {/* Contests List */}
        <div className="grid gap-4">
          {loading ? (
            <Card className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading contests...</p>
            </Card>
          ) : contests.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No contests found. Create your first contest to get started.</p>
            </Card>
          ) : (
            contests.map((contest) => (
              <Card key={contest.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{contest.title}</h3>
                      {getStatusBadge(contest.status)}
                    </div>
                    {contest.description && (
                      <p className="text-sm text-muted-foreground mb-4">{contest.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">Start</div>
                          <div className="font-medium">{formatDate(contest.start_date)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">End</div>
                          <div className="font-medium">{formatDate(contest.end_date)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">Prize</div>
                          <div className="font-medium">{contest.prize_points} points</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">Participants</div>
                          <div className="font-medium">{contest.participant_count}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/contests/${contest.id}`)}
                    >
                      View Details
                    </Button>
                    {contest.status === 'draft' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleStartContest(contest.id)}
                        >
                          Start Contest
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/contests/${contest.id}/edit`)}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

