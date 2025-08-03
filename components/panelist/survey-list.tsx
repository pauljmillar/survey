'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'

interface Survey {
  id: string
  title: string
  description: string
  points_reward: number
  estimated_completion_time: number
  created_at: string
}

interface SurveyListProps {
  limit?: number
  showFilters?: boolean
  showPagination?: boolean
  className?: string
}

export function SurveyList({ 
  limit = 10, 
  showFilters = true,
  showPagination = true,
  className = ''
}: SurveyListProps) {
  const { isSignedIn } = useAuth()
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [pointsFilter, setPointsFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [timeFilter, setTimeFilter] = useState<'all' | 'quick' | 'medium' | 'long'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [completingId, setCompletingId] = useState<string | null>(null)

  // Real-time subscription for survey availability updates
  const { isConnected: isRealtimeConnected } = useRealtime(
    { enableSurveyAvailability: true, enableSurveyQualifications: true },
    {
      onSurveyAvailabilityUpdate: (newSurvey) => {
        // Add new survey to the list if it matches current filters
        setSurveys(prev => {
          const filtered = prev.filter(s => s.id !== newSurvey.id)
          return [newSurvey, ...filtered]
        })
      },
      onSurveyQualificationUpdate: (qualification) => {
        // Update survey qualification status
        setSurveys(prev => 
          prev.map(survey => 
            survey.id === qualification.survey_id 
              ? { ...survey, is_qualified: qualification.is_qualified }
              : survey
          )
        )
      },
    }
  )

  const fetchSurveys = async () => {
    if (!isSignedIn) return

    try {
      setLoading(true)
      const offset = (currentPage - 1) * limit
      const response = await fetch(`/api/surveys/available?limit=${limit}&offset=${offset}`)
      
      if (response.ok) {
        const data = await response.json()
        setSurveys(data.surveys || [])
        setError(null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load surveys')
      }
    } catch (error) {
      console.error('Error fetching surveys:', error)
      setError('Network error - please try again')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSurveys()
  }, [isSignedIn, currentPage, limit])

  const handleSurveyComplete = async (surveyId: string) => {
    setCompletingId(surveyId)
    try {
      const response = await fetch('/api/surveys/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          survey_id: surveyId,
          response_data: {
            completed_at: new Date().toISOString(),
            source: 'dashboard'
          }
        }),
      })

      if (response.ok) {
        const result = await response.json()
        // Remove completed survey from list
        setSurveys(prev => prev.filter(s => s.id !== surveyId))
        
        // Show success message or notification
        alert(`Survey completed! You earned ${result.points_earned} points. New balance: ${result.new_balance}`)
        
        // Refresh the list to get updated surveys
        fetchSurveys()
      } else {
        const errorData = await response.json()
        alert(`Error completing survey: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error completing survey:', error)
      alert('Failed to complete survey. Please try again.')
    } finally {
      setCompletingId(null)
    }
  }

  // Filter surveys based on search and filters
  const filteredSurveys = surveys.filter(survey => {
    // Search filter
    const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Points filter
    let matchesPoints = true
    if (pointsFilter === 'low') matchesPoints = survey.points_reward <= 50
    else if (pointsFilter === 'medium') matchesPoints = survey.points_reward > 50 && survey.points_reward <= 150
    else if (pointsFilter === 'high') matchesPoints = survey.points_reward > 150
    
    // Time filter
    let matchesTime = true
    if (timeFilter === 'quick') matchesTime = survey.estimated_completion_time <= 5
    else if (timeFilter === 'medium') matchesTime = survey.estimated_completion_time > 5 && survey.estimated_completion_time <= 15
    else if (timeFilter === 'long') matchesTime = survey.estimated_completion_time > 15
    
    return matchesSearch && matchesPoints && matchesTime
  })

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {showFilters && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        )}
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className={`p-8 text-center border-red-200 ${className}`}>
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Surveys</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchSurveys}>
          Try Again
        </Button>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      {showFilters && (
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Search surveys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Points</label>
              <select
                value={pointsFilter}
                onChange={(e) => setPointsFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Points</option>
                <option value="low">Low (≤50)</option>
                <option value="medium">Medium (51-150)</option>
                <option value="high">High (>150)</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Duration</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Durations</option>
                <option value="quick">Quick (≤5 min)</option>
                <option value="medium">Medium (6-15 min)</option>
                <option value="long">Long (>15 min)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Survey Count */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {filteredSurveys.length} survey{filteredSurveys.length !== 1 ? 's' : ''} available
        </p>
        {filteredSurveys.length > 0 && (
          <p className="text-sm text-gray-500">
            Sorted by newest first
          </p>
        )}
      </div>

      {/* Surveys List */}
      {filteredSurveys.length === 0 ? (
        <EmptyState
          icon={<span role="img" aria-label="Clipboard">📋</span>}
          title="No Surveys Available"
          message={
            searchTerm || pointsFilter !== 'all' || timeFilter !== 'all'
              ? 'No surveys match your current filters. Try adjusting your search criteria.'
              : 'Check back later for new survey opportunities!'
          }
          actionLabel={
            searchTerm || pointsFilter !== 'all' || timeFilter !== 'all'
              ? 'Clear Filters'
              : undefined
          }
          onAction={
            searchTerm || pointsFilter !== 'all' || timeFilter !== 'all'
              ? () => {
                  setSearchTerm('')
                  setPointsFilter('all')
                  setTimeFilter('all')
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredSurveys.map((survey) => (
            <Card key={survey.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {survey.title}
                    </h3>
                    <span className="ml-2 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(survey.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {survey.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <span className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-blue-600 text-xs font-semibold">$</span>
                      </span>
                      <span className="font-semibold text-blue-600">
                        {survey.points_reward} points
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-green-600 text-xs">⏱</span>
                      </span>
                      <span className="text-gray-600">
                        {formatTime(survey.estimated_completion_time)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 lg:mt-0 lg:ml-6 flex-shrink-0">
                  <Button
                    onClick={() => handleSurveyComplete(survey.id)}
                    disabled={completingId === survey.id}
                    className="w-full lg:w-auto min-w-[120px]"
                  >
                    {completingId === survey.id ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Completing...
                      </div>
                    ) : (
                      'Start Survey'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {showPagination && filteredSurveys.length >= limit && (
        <div className="flex justify-center items-center gap-4 pt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={filteredSurveys.length < limit}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

// Compact survey list for dashboard widgets
export function CompactSurveyList({ limit = 3, className }: { limit?: number; className?: string }) {
  return (
    <SurveyList 
      limit={limit}
      showFilters={false}
      showPagination={false}
      className={className}
    />
  )
}

// Survey card component for individual survey display
export function SurveyCard({ survey, onComplete }: { 
  survey: Survey
  onComplete: (id: string) => void 
}) {
  const [completing, setCompleting] = useState(false)

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await onComplete(survey.id)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {survey.title}
      </h3>
      <p className="text-gray-600 mb-4">
        {survey.description}
      </p>
      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-sm">
          <span className="font-semibold text-blue-600">
            {survey.points_reward} points
          </span>
          <span className="text-gray-600">
            {survey.estimated_completion_time} min
          </span>
        </div>
        <Button onClick={handleComplete} disabled={completing}>
          {completing ? 'Starting...' : 'Start Survey'}
        </Button>
      </div>
    </Card>
  )
} 