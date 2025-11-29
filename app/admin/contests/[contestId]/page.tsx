'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, Users, Calendar, RefreshCw, Award } from 'lucide-react'
import Link from 'next/link'

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
}

interface Participant {
  id: string
  rank: number | null
  points_earned: number
  prize_awarded: boolean
  panelist: {
    id: string
    user_id: string
    users: Array<{ email: string }>
  }
}

export default function ContestDetailsPage({ params }: { params: Promise<{ contestId: string }> }) {
  const router = useRouter()
  const [contestId, setContestId] = useState<string>('')
  const [contest, setContest] = useState<Contest | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const loadParams = async () => {
      const resolved = await params
      if (mounted) {
        setContestId(resolved.contestId)
        fetchContest(resolved.contestId)
      }
    }
    loadParams()
    return () => { mounted = false }
  }, [params])

  const fetchContest = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/contests/${id}`)
      if (response.ok) {
        const data = await response.json()
        setContest(data.contest)
        setParticipants(data.participants || [])
      }
    } catch (error) {
      console.error('Error fetching contest:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async () => {
    setActionLoading('start')
    try {
      const response = await fetch(`/api/admin/contests/${contestId}/start`, { method: 'POST' })
      if (response.ok) {
        fetchContest(contestId)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to start contest')
      }
    } catch (error) {
      alert('Error starting contest')
    } finally {
      setActionLoading(null)
    }
  }

  const handleEnd = async () => {
    setActionLoading('end')
    try {
      const response = await fetch(`/api/admin/contests/${contestId}/end`, { method: 'POST' })
      if (response.ok) {
        fetchContest(contestId)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to end contest')
      }
    } catch (error) {
      alert('Error ending contest')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateLeaderboard = async () => {
    setActionLoading('leaderboard')
    try {
      const response = await fetch(`/api/admin/contests/${contestId}/update-leaderboard`, { method: 'POST' })
      if (response.ok) {
        fetchContest(contestId)
      } else {
        alert('Failed to update leaderboard')
      }
    } catch (error) {
      alert('Error updating leaderboard')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAwardPrize = async (panelistId: string) => {
    if (!confirm('Award prize to this participant?')) return

    try {
      const response = await fetch(`/api/admin/contests/${contestId}/award-prize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panelist_id: panelistId })
      })
      if (response.ok) {
        fetchContest(contestId)
        alert('Prize awarded successfully')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to award prize')
      }
    } catch (error) {
      alert('Error awarding prize')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contest...</p>
        </div>
      </div>
    )
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Contest not found</p>
          <Link href="/admin/contests">
            <Button variant="outline" className="mt-4">
              Back to Contests
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/contests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contests
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{contest.title}</h1>
              {getStatusBadge(contest.status)}
            </div>
            {contest.description && (
              <p className="text-muted-foreground mt-2">{contest.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {contest.status === 'draft' && (
              <>
                <Button
                  onClick={handleStart}
                  disabled={actionLoading === 'start'}
                >
                  Start Contest
                </Button>
                <Link href={`/admin/contests/${contestId}/edit`}>
                  <Button variant="outline">Edit</Button>
                </Link>
              </>
            )}
            {contest.status === 'active' && (
              <Button
                onClick={handleEnd}
                disabled={actionLoading === 'end'}
                variant="destructive"
              >
                End Contest
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Start</div>
                  <div className="font-medium">{formatDate(contest.start_date)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">End</div>
                  <div className="font-medium">{formatDate(contest.end_date)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Prize
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contest.prize_points} points</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{participants.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Leaderboard</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpdateLeaderboard}
            disabled={actionLoading === 'leaderboard'}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${actionLoading === 'leaderboard' ? 'animate-spin' : ''}`} />
            Update Leaderboard
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Participant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Prize Status</th>
                    {contest.status === 'ended' && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {participants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No participants yet
                      </td>
                    </tr>
                  ) : (
                    participants.map((participant) => (
                      <tr key={participant.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4">
                          {participant.rank || '-'}
                        </td>
                        <td className="px-6 py-4">
                          {participant.panelist.users[0]?.email || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {participant.points_earned}
                        </td>
                        <td className="px-6 py-4">
                          {participant.prize_awarded ? (
                            <Badge variant="default">Awarded</Badge>
                          ) : (
                            <Badge variant="secondary">Not Awarded</Badge>
                          )}
                        </td>
                        {contest.status === 'ended' && (
                          <td className="px-6 py-4 text-right">
                            {!participant.prize_awarded && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAwardPrize(participant.panelist.id)}
                              >
                                <Award className="w-4 h-4 mr-2" />
                                Award Prize
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

