'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Search, 
  Filter, 
  Award, 
  Clock, 
  Calendar,
  Play
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'

interface Survey {
  id: string
  title: string
  description: string
  points_reward: number
  estimated_completion_time: number
  created_at: string
  is_qualified?: boolean
  audience_count?: number
  is_completed?: boolean
  completed_at?: string | null
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
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [pointsFilter, setPointsFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const { isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) {
      fetchSurveys()
    }
  }, [isSignedIn, currentPage, limit])

  const fetchSurveys = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/panelist/surveys')
      
      if (!response.ok) {
        throw new Error('Failed to fetch surveys')
      }
      
      const data = await response.json()
      setSurveys(data.surveys || [])
    } catch (error) {
      console.error('Error fetching surveys:', error)
      setError('Failed to load surveys')
    } finally {
      setLoading(false)
    }
  }

  const handleStartSurvey = (surveyId: string) => {
    // Navigate to the survey taking page
    router.push(`/panelist/survey/${surveyId}`)
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
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={fetchSurveys} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      {showFilters && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search surveys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">Points:</span>
              <select
                value={pointsFilter}
                onChange={(e) => setPointsFilter(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All</option>
                <option value="low">Low (&le;50)</option>
                <option value="medium">Medium (51-150)</option>
                <option value="high">High (&gt;150)</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">Time:</span>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All</option>
                <option value="quick">Quick (&le;5 min)</option>
                <option value="medium">Medium (6-15 min)</option>
                <option value="long">Long (&gt;15 min)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Survey List */}
      {filteredSurveys.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || pointsFilter !== 'all' || timeFilter !== 'all'
                  ? 'No surveys match your filters. Try adjusting your search criteria.'
                  : 'No surveys available at the moment. Check back later!'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Available Surveys Section */}
          {filteredSurveys.filter(survey => !survey.is_completed).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Available Surveys</h3>
              <div className="space-y-4">
                {filteredSurveys.filter(survey => !survey.is_completed).slice(0, limit).map((survey) => (
                  <Card key={survey.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {survey.title}
                          </h3>
                          <Badge variant="secondary" className="ml-2 flex-shrink-0">
                            {survey.points_reward} pts
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-4">
                          {survey.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-sm">
                          <div className="flex items-center">
                            <span className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-2">
                              <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold">$</span>
                            </span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {survey.points_reward} points
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-2">
                              <span className="text-green-600 dark:text-green-400 text-xs" role="img" aria-label="Timer">⏱</span>
                            </span>
                            <span className="text-muted-foreground">
                              {formatTime(survey.estimated_completion_time)}
                            </span>
                          </div>
                          
                          {survey.audience_count !== undefined && (
                            <div className="flex items-center">
                              <span className="w-4 h-4 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-2">
                                <span className="text-purple-600 dark:text-purple-400 text-xs" role="img" aria-label="Users">👥</span>
                              </span>
                              <span className="text-muted-foreground">
                                {survey.audience_count} eligible
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 lg:mt-0 lg:ml-6 flex-shrink-0">
                        <Button
                          onClick={() => handleStartSurvey(survey.id)}
                          className="w-full lg:w-auto min-w-[120px]"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start Survey
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Surveys Section */}
          {filteredSurveys.filter(survey => survey.is_completed).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Completed Surveys</h3>
              <div className="space-y-4">
                {filteredSurveys.filter(survey => survey.is_completed).map((survey) => (
                  <Card key={survey.id} className="p-6 hover:shadow-lg transition-shadow border-green-200 dark:border-green-800">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {survey.title}
                          </h3>
                          <Badge variant="outline" className="ml-2 flex-shrink-0 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                            <span className="hidden sm:inline">✓ Completed</span>
                            <span className="sm:hidden">✓</span>
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-4">
                          {survey.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-sm">
                          <div className="flex items-center">
                            <span className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-2">
                              <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold">$</span>
                            </span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {survey.points_reward} points
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-2">
                              <span className="text-green-600 dark:text-green-400 text-xs" role="img" aria-label="Timer">⏱</span>
                            </span>
                            <span className="text-muted-foreground">
                              {formatTime(survey.estimated_completion_time)}
                            </span>
                          </div>
                          
                          {survey.completed_at && (
                            <div className="flex items-center">
                              <span className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-2">
                                <span className="text-green-600 dark:text-green-400 text-xs" role="img" aria-label="Calendar">📅</span>
                              </span>
                              <span className="text-muted-foreground">
                                Completed {formatDate(survey.completed_at)}
                              </span>
                            </div>
                          )}
                          
                          {survey.audience_count !== undefined && (
                            <div className="flex items-center">
                              <span className="w-4 h-4 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-2">
                                <span className="text-purple-600 dark:text-purple-400 text-xs" role="img" aria-label="Users">👥</span>
                              </span>
                              <span className="text-muted-foreground">
                                {survey.audience_count} eligible
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
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
          <span className="text-sm text-muted-foreground">
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
  const router = useRouter()

  const handleStartSurvey = () => {
    // Navigate to the survey taking page
    router.push(`/panelist/survey/${survey.id}`)
  }

  return (
    <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {survey.title}
      </h3>
      <p className="text-muted-foreground mb-4">
        {survey.description}
      </p>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {survey.points_reward} points
          </span>
          <span className="text-muted-foreground">
            {survey.estimated_completion_time} min
          </span>
          {survey.audience_count !== undefined && (
            <span className="text-muted-foreground">
              👥 {survey.audience_count} eligible
            </span>
          )}
        </div>
        <Button onClick={handleStartSurvey} className="w-full sm:w-auto">
          <Play className="h-4 w-4 mr-1" />
          Start Survey
        </Button>
      </div>
    </Card>
  )
} 