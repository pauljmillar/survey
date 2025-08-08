'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  MoreHorizontal,
  Calendar,
  Users,
  Award,
  Plus,
  Trash2,
  AlertTriangle,
  BarChart3,
  Play,
  Pause
} from 'lucide-react'
import { SurveyViewer } from './survey-viewer'
import { SurveyEditor } from './survey-editor'
import { SurveyResults } from './survey-results'
import Link from 'next/link'

interface Survey {
  id: string
  title: string
  description: string
  points_reward: number
  estimated_completion_time: number
  status: 'draft' | 'active' | 'inactive'
  created_at: string
  updated_at: string
  completion_count?: number
  average_rating?: number
  audience_count?: number
  response_count?: number
  qualification_criteria?: any
}

export function SurveyList() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'draft'>('all')
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit' | 'results'>('list')
  const [recalculating, setRecalculating] = useState<string | null>(null)
  const [deletingSurveyId, setDeletingSurveyId] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchSurveys()
  }, [])

  const fetchSurveys = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/surveys')
      
      if (!response.ok) {
        throw new Error('Failed to fetch surveys')
      }
      
      const data = await response.json()
      
      // Fetch response counts for each survey
      const surveysWithCounts = await Promise.all(
        (data.surveys || []).map(async (survey: Survey) => {
          try {
            const countResponse = await fetch(`/api/surveys/${survey.id}/responses`)
            if (countResponse.ok) {
              const countData = await countResponse.json()
              return { ...survey, response_count: countData.response_count || 0 }
            }
          } catch (error) {
            console.error(`Error fetching response count for survey ${survey.id}:`, error)
          }
          return { ...survey, response_count: 0 }
        })
      )
      
      setSurveys(surveysWithCounts)
    } catch (error) {
      console.error('Error fetching surveys:', error)
      setError('Failed to load surveys')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSurvey = async (surveyId: string, surveyTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${surveyTitle}"? This action cannot be undone and will remove all survey data including responses and questions.`)) {
      return
    }

    try {
      setDeletingSurveyId(surveyId)
      
      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete survey')
      }

      // Remove the survey from the local state
      setSurveys(prev => prev.filter(survey => survey.id !== surveyId))
      
      // Show success message (you could add a toast notification here)
      console.log('Survey deleted successfully')
    } catch (error) {
      console.error('Error deleting survey:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete survey')
    } finally {
      setDeletingSurveyId(null)
    }
  }

  const handleStatusChange = async (surveyId: string, newStatus: 'active' | 'inactive') => {
    try {
      setUpdatingStatus(surveyId)
      
      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update survey status')
      }

      // Update the survey in local state
      setSurveys(prev => prev.map(survey => 
        survey.id === surveyId ? { ...survey, status: newStatus } : survey
      ))
      
      console.log(`Survey status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating survey status:', error)
      alert(error instanceof Error ? error.message : 'Failed to update survey status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Handle view/edit/results modes
  if (viewMode === 'view' && selectedSurveyId) {
    return (
      <SurveyViewer
        surveyId={selectedSurveyId}
        onBack={() => {
          setViewMode('list')
          setSelectedSurveyId(null)
        }}
        onEdit={() => {
          setViewMode('edit')
        }}
      />
    )
  }

  if (viewMode === 'edit' && selectedSurveyId) {
    return (
      <SurveyEditor
        surveyId={selectedSurveyId}
        onBack={() => {
          setViewMode('list')
          setSelectedSurveyId(null)
        }}
        onSave={() => {
          setViewMode('list')
          setSelectedSurveyId(null)
          fetchSurveys() // Refresh the list
        }}
      />
    )
  }

  if (viewMode === 'results' && selectedSurveyId) {
    return (
      <SurveyResults
        surveyId={selectedSurveyId}
        onBack={() => {
          setViewMode('list')
          setSelectedSurveyId(null)
        }}
      />
    )
  }

  const recalculateAudience = async (surveyId: string) => {
    try {
      setRecalculating(surveyId)
      const response = await fetch(`/api/surveys/${surveyId}/recalculate-audience`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to recalculate audience')
      }
      
      // Refresh the surveys list to show updated counts
      await fetchSurveys()
    } catch (error) {
      console.error('Error recalculating audience:', error)
      alert('Failed to recalculate audience')
    } finally {
      setRecalculating(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary", 
      draft: "outline"
    } as const
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || survey.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={fetchSurveys} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search surveys..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('active')}
          >
            Active
          </Button>
          <Button
            variant={filterStatus === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('draft')}
          >
            Draft
          </Button>
          <Button
            variant={filterStatus === 'inactive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('inactive')}
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Survey List */}
      {filteredSurveys.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || filterStatus !== 'all' 
              ? 'No surveys match your search criteria.' 
              : 'No surveys found. Create your first survey to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSurveys.map((survey) => (
            <Card key={survey.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 
                        className="font-semibold text-lg cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => {
                          setSelectedSurveyId(survey.id)
                          setViewMode('view')
                        }}
                      >
                        {survey.title}
                      </h3>
                      {getStatusBadge(survey.status)}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {survey.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span>{survey.points_reward} points</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created {formatDate(survey.created_at)}</span>
                      </div>
                      {survey.completion_count !== undefined && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{survey.completion_count} completions</span>
                        </div>
                      )}
                      {survey.audience_count !== undefined && (
                        <div className="flex items-center gap-1">
                          <span className="text-purple-600 dark:text-purple-400">👥</span>
                          <span>{survey.audience_count} eligible</span>
                        </div>
                      )}
                      {survey.response_count !== undefined && (
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4 text-green-600" />
                          <span>{survey.response_count} responses</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedSurveyId(survey.id)
                            setViewMode('edit')
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Survey
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedSurveyId(survey.id)
                            setViewMode('results')
                          }}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Results
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/surveys/${survey.id}/results`}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Open Results Page
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {survey.status === 'active' ? (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(survey.id, 'inactive')}
                            disabled={updatingStatus === survey.id}
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            {updatingStatus === survey.id ? 'Disabling...' : 'Disable Survey'}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(survey.id, 'active')}
                            disabled={updatingStatus === survey.id}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {updatingStatus === survey.id ? 'Enabling...' : 'Enable Survey'}
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem
                          onClick={() => recalculateAudience(survey.id)}
                          disabled={recalculating === survey.id}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          {recalculating === survey.id ? 'Recalculating...' : 'Recalculate Audience'}
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem
                          onClick={() => handleDeleteSurvey(survey.id, survey.title)}
                          disabled={deletingSurveyId === survey.id}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deletingSurveyId === survey.id ? 'Deleting...' : 'Delete Survey'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 