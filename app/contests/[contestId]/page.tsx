'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, Calendar, Users, ArrowRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Contest {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  prize_points: number
  status: 'draft' | 'active' | 'ended' | 'cancelled'
}

interface Participation {
  rank: number | null
  points_earned: number
}

interface LeaderboardEntry {
  rank: number | null
  points_earned: number
  panelist: {
    users: Array<{ email: string }>
  }
}

export default function ContestDetailsPage({ params }: { params: Promise<{ contestId: string }> }) {
  const router = useRouter()
  const [contestId, setContestId] = useState<string>('')
  const [contest, setContest] = useState<Contest | null>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [participation, setParticipation] = useState<Participation | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const loadParams = async () => {
      const resolved = await params
      setContestId(resolved.contestId)
      fetchContest(resolved.contestId)
    }
    loadParams()
  }, [params])

  // Set up auto-refresh for active contests
  useEffect(() => {
    if (contest?.status === 'active' && contestId) {
      const interval = setInterval(() => {
        fetchContest(contestId)
      }, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [contest?.status, contestId])

  const fetchContest = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contests/${id}`)
      if (response.ok) {
        const data = await response.json()
        setContest(data.contest)
        setHasJoined(data.has_joined)
        setParticipation(data.participation)
        setLeaderboard(data.leaderboard || [])
      } else {
        if (response.status === 403) {
          router.push('/contests')
        }
      }
    } catch (error) {
      console.error('Error fetching contest:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    setJoining(true)
    try {
      const response = await fetch(`/api/contests/${contestId}/join`, { method: 'POST' })
      if (response.ok) {
        fetchContest(contestId)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to join contest')
      }
    } catch (error) {
      alert('Error joining contest')
    } finally {
      setJoining(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchContest(contestId)
    setRefreshing(false)
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contest...</p>
        </div>
      </div>
    )
  }

  if (!contest) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Contest not found</p>
          <Link href="/contests">
            <Button variant="outline" className="mt-4">
              Back to Contests
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const isActive = contest.status === 'active'
  const isEnded = contest.status === 'ended'

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{contest.title}</h1>
              {isActive && <Badge variant="default">Active</Badge>}
              {isEnded && <Badge variant="outline">Ended</Badge>}
            </div>
            {contest.description && (
              <p className="text-muted-foreground">{contest.description}</p>
            )}
          </div>
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>

        {!hasJoined && isActive && (
          <Card className="mb-6 border-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-2">Join this contest!</h3>
                  <p className="text-sm text-muted-foreground">
                    Compete with other panelists to earn the most points and win {contest.prize_points} points!
                  </p>
                </div>
                <Button onClick={handleJoin} disabled={joining}>
                  {joining ? 'Joining...' : 'Join Contest'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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

          {hasJoined && participation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Your Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Rank</div>
                    <div className="text-xl font-bold">
                      {participation.rank ? `#${participation.rank}` : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Points Earned</div>
                    <div className="text-xl font-bold">{participation.points_earned}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>Top participants in this contest</CardDescription>
              </div>
              {leaderboard.length > 10 && (
                <Link href={`/contests/${contestId}/leaderboard`}>
                  <Button variant="outline" size="sm">
                    View Full Leaderboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No participants yet</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 text-center font-bold">
                        {entry.rank || '-'}
                      </div>
                      <div>
                        <div className="font-medium">
                          {entry.panelist.users[0]?.email || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold">{entry.points_earned} points</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}

