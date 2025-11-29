'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy } from 'lucide-react'
import Link from 'next/link'

interface LeaderboardEntry {
  rank: number | null
  points_earned: number
  joined_at: string
  panelist: {
    users: Array<{ email: string }>
  }
}

export default function LeaderboardPage({ params }: { params: Promise<{ contestId: string }> }) {
  const [contestId, setContestId] = useState<string>('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [userPoints, setUserPoints] = useState<number | null>(null)
  const [contestStatus, setContestStatus] = useState<string>('')
  const [totalParticipants, setTotalParticipants] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadParams = async () => {
      const resolved = await params
      setContestId(resolved.contestId)
      fetchLeaderboard(resolved.contestId)
    }
    loadParams()
  }, [params])

  const fetchLeaderboard = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contests/${id}/leaderboard`)
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data.leaderboard || [])
        setUserRank(data.user_rank)
        setUserPoints(data.user_points)
        setContestStatus(data.contest_status)
        setTotalParticipants(data.total_participants || 0)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  const isEnded = contestStatus === 'ended'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
          <Link href={`/contests/${contestId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contest
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
            {isEnded && (
              <Badge variant="outline" className="mt-2">Contest Ended</Badge>
            )}
          </div>
        </div>

        {isEnded && (
          <Card className="mb-6 border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10">
            <CardContent className="p-4">
              <p className="text-sm text-foreground">
                This contest has ended. Final rankings are shown below.
              </p>
            </CardContent>
          </Card>
        )}

        {userRank !== null && (
          <Card className="mb-6 border-primary">
            <CardHeader>
              <CardTitle>Your Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Your Rank</div>
                  <div className="text-2xl font-bold">#{userRank}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Your Points</div>
                  <div className="text-2xl font-bold">{userPoints || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              All Participants ({totalParticipants})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No participants yet</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.rank === userRank
                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        isCurrentUser
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 text-center">
                          {entry.rank === 1 ? (
                            <Trophy className="w-6 h-6 text-yellow-500 mx-auto" />
                          ) : (
                            <div className="font-bold text-lg">
                              {entry.rank || '-'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {entry.panelist.users[0]?.email || 'Unknown'}
                            {isCurrentUser && (
                              <Badge variant="default" className="ml-2">You</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="font-semibold text-lg">{entry.points_earned} points</div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}

