'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, Award, ArrowRight, Users } from 'lucide-react'
import Link from 'next/link'

interface LeaderboardEntry {
  rank: number | null
  points_earned: number
  panelist: {
    users: Array<{ email: string }>
  }
}

interface Contest {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  prize_points: number
  user_rank: number | null
  user_points: number
  total_participants: number
  leaderboard: LeaderboardEntry[]
}

export function ContestLeaderboards() {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/contests/my-active')
      
      if (!response.ok) {
        throw new Error('Failed to fetch contests')
      }
      
      const data = await response.json()
      setContests(data.contests || [])
      setError(null)
    } catch (error) {
      console.error('Error fetching active contests:', error)
      setError('Failed to load contests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContests()

    // Auto-refresh every 30 seconds for active contests
    const interval = setInterval(() => {
      fetchContests()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Don't render anything if no active contests
  if (loading) {
    return null // Don't show loading state - just don't render
  }

  if (error || contests.length === 0) {
    return null // Don't show empty state - just don't render
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Chicago'
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Active Contests</h2>
        <p className="text-sm text-muted-foreground">
          Your current standings in active contests
        </p>
      </div>

      <div className="grid gap-4">
        {contests.map((contest) => (
          <Card key={contest.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{contest.title}</CardTitle>
                    <Badge variant="default" className="bg-green-600">
                      Active
                    </Badge>
                  </div>
                  {contest.description && (
                    <CardDescription className="mb-3">
                      {contest.description}
                    </CardDescription>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>{contest.prize_points} points prize</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{contest.total_participants} participants</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* User's Position */}
              <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Your Position</div>
                    <div className="flex items-center gap-2">
                      {contest.user_rank ? (
                        <>
                          <span className="text-2xl font-bold text-primary">
                            #{contest.user_rank}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            of {contest.total_participants}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not ranked yet</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Your Points</div>
                    <div className="text-2xl font-bold text-primary">
                      {contest.user_points.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Leaderboard */}
              {contest.leaderboard.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Top Participants
                  </div>
                  <div className="space-y-1">
                    {contest.leaderboard.map((entry, index) => {
                      const isCurrentUser = entry.rank === contest.user_rank
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-2 rounded ${
                            isCurrentUser
                              ? 'bg-primary/10 border border-primary/20'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 text-center">
                              {entry.rank === 1 ? (
                                <Trophy className="w-5 h-5 text-yellow-500 mx-auto" />
                              ) : (
                                <span className="font-semibold text-sm">
                                  {entry.rank || '-'}
                                </span>
                              )}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">
                                {entry.panelist.users[0]?.email || 'Unknown'}
                              </span>
                              {isCurrentUser && (
                                <Badge variant="default" className="ml-2 text-xs">You</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-sm font-semibold">
                            {entry.points_earned.toLocaleString()} pts
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* View Full Leaderboard Button */}
              <Link href={`/contests/${contest.id}`}>
                <Button variant="outline" className="w-full">
                  View Full Leaderboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

