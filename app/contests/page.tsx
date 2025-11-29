'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, Calendar, Users, ArrowRight } from 'lucide-react'

interface Contest {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  prize_points: number
  status: 'draft' | 'active' | 'ended' | 'cancelled'
  has_joined: boolean
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
        
        setContests(filtered)
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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

