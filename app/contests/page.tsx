'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, Calendar, Users, ArrowRight, Award } from 'lucide-react'
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
  status: 'draft' | 'active' | 'ended' | 'cancelled'
  has_joined: boolean
  // Leaderboard data (only for joined contests)
  user_rank?: number | null
  user_points?: number
  total_participants?: number
  leaderboard?: LeaderboardEntry[]
}

export default function ContestsPage() {
  const router = useRouter()
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'ended' | 'my'>('active')

  useEffect(() => {
    fetchContests()
  }, [activeTab])

  const fetchContests = async () => {
    try {
      setLoading(true)
      const status = activeTab === 'my' ? 'active' : activeTab
      const response = await fetch(`/api/contests?status=${status}`)
      
      if (response.ok) {
        const data = await response.json()
        let filtered = data.contests || []
        
        // Filter to only joined contests if "My Contests" tab
        if (activeTab === 'my') {
          filtered = filtered.filter((c: Contest) => c.has_joined)
        }
        
        // For joined active contests, fetch leaderboard data
        const contestsWithLeaderboards = await Promise.all(
          filtered.map(async (contest: Contest) => {
            if (contest.has_joined && contest.status === 'active') {
              try {
                // Fetch both contest details and leaderboard
                const [contestResponse, leaderboardResponse] = await Promise.all([
                  fetch(`/api/contests/${contest.id}`),
                  fetch(`/api/contests/${contest.id}/leaderboard?limit=5`)
                ])
                
                if (contestResponse.ok && leaderboardResponse.ok) {
                  const contestData = await contestResponse.json()
                  const leaderboardData = await leaderboardResponse.json()
                  
                  return {
                    ...contest,
                    user_rank: contestData.participation?.rank || leaderboardData.user_rank || null,
                    user_points: contestData.participation?.points_earned || leaderboardData.user_points || 0,
                    total_participants: leaderboardData.total_participants || 0,
                    leaderboard: (leaderboardData.leaderboard || []).slice(0, 5) // Top 5
                  }
                }
              } catch (error) {
                console.error(`Error fetching leaderboard for contest ${contest.id}:`, error)
              }
            }
            return contest
          })
        )
        
        setContests(contestsWithLeaderboards)
      } else {
        console.error('Failed to fetch contests')
      }
    } catch (error) {
      console.error('Error fetching contests:', error)
    } finally {
      setLoading(false)
    }
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Contests</h1>
        <p className="text-muted-foreground mt-2">
          Join contests and compete for prizes!
        </p>
      </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('ended')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'ended'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Ended
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'my'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            My Contests
          </button>
        </div>

        {/* Contests List */}
        <div className="grid gap-4">
          {loading ? (
            <Card className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading contests...</p>
            </Card>
          ) : contests.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                {activeTab === 'my' 
                  ? "You haven't joined any contests yet."
                  : 'No contests available at this time.'}
              </p>
            </Card>
          ) : (
            contests.map((contest) => (
              <Card key={contest.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{contest.title}</h3>
                      {contest.has_joined && (
                        <Badge variant="default">Joined</Badge>
                      )}
                      {contest.status === 'ended' && (
                        <Badge variant="outline">Ended</Badge>
                      )}
                    </div>
                    {contest.description && (
                      <p className="text-sm text-muted-foreground mb-4">{contest.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
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
                    </div>

                    {/* Leaderboard Section for Joined Contests */}
                    {contest.has_joined && contest.status === 'active' && (
                      <div className="mt-4 pt-4 border-t">
                        {/* User's Position */}
                        {(contest.user_rank !== undefined || contest.user_points !== undefined) && (
                          <div className="mb-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Your Position</div>
                                <div className="flex items-center gap-2">
                                  {contest.user_rank ? (
                                    <>
                                      <span className="text-xl font-bold text-primary">
                                        #{contest.user_rank}
                                      </span>
                                      {contest.total_participants && (
                                        <span className="text-sm text-muted-foreground">
                                          of {contest.total_participants}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">Not ranked yet</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground mb-1">Your Points</div>
                                <div className="text-xl font-bold text-primary">
                                  {contest.user_points?.toLocaleString() || 0}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Top Leaderboard */}
                        {contest.leaderboard && contest.leaderboard.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs font-medium text-muted-foreground mb-2">
                              Top Participants
                            </div>
                            <div className="space-y-1">
                              {contest.leaderboard.map((entry, index) => {
                                const isCurrentUser = entry.rank === contest.user_rank
                                return (
                                  <div
                                    key={index}
                                    className={`flex items-center justify-between p-2 rounded text-sm ${
                                      isCurrentUser
                                        ? 'bg-primary/10 border border-primary/20'
                                        : 'hover:bg-muted/50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 text-center">
                                        {entry.rank === 1 ? (
                                          <Trophy className="w-4 h-4 text-yellow-500 mx-auto" />
                                        ) : (
                                          <span className="font-semibold text-xs">
                                            {entry.rank || '-'}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs">
                                        <span className="font-medium">
                                          {entry.panelist.users[0]?.email || 'Unknown'}
                                        </span>
                                        {isCurrentUser && (
                                          <Badge variant="default" className="ml-1 text-xs">You</Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-xs font-semibold">
                                      {entry.points_earned.toLocaleString()} pts
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* View Full Leaderboard Link */}
                        <Link href={`/contests/${contest.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            View Full Leaderboard
                            <ArrowRight className="w-3 h-3 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <Button
                      onClick={() => router.push(`/contests/${contest.id}`)}
                      variant={contest.has_joined ? "outline" : "default"}
                    >
                      {contest.has_joined ? 'View Details' : 'View Contest'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
    </div>
  )
}

