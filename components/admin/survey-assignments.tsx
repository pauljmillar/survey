'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Target, 
  Users, 
  Calendar, 
  Trash2, 
  AlertCircle,
  Eye
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Assignment {
  id: string
  survey_id: string
  survey_title: string
  audience_preset_id?: string
  audience_preset_name?: string
  assigned_by: string
  assigned_at: string
  assignment_metadata: {
    panelist_count: number
    program: string
    assignment_type?: string
    assigned_at: string
  }
}

export function SurveyAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/survey-assignments')
      
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      } else {
        setError('Failed to load assignments')
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
      setError('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment? This will unassign the survey from the audience.')) {
      return
    }

    try {
      setDeleting(assignmentId)
      const response = await fetch(`/api/admin/survey-assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAssignments(prev => prev.filter(a => a.id !== assignmentId))
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete assignment')
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert('Failed to delete assignment')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Survey Assignments
          </CardTitle>
          <CardDescription>
            Loading survey assignments...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Survey Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Survey Assignments
        </CardTitle>
        <CardDescription>
          View and manage survey audience assignments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Assignments Yet</h3>
            <p className="text-muted-foreground">
              Survey assignments will appear here once you assign surveys to audiences.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Survey</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Panelists</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{assignment.survey_title}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {assignment.survey_id.slice(0, 8)}...
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {assignment.audience_preset_name ? (
                      <div>
                        <p className="font-medium">{assignment.audience_preset_name}</p>
                        <Badge variant="outline" className="text-xs">
                          Saved Preset
                        </Badge>
                      </div>
                    ) : (
                      <div>
                        <p className="text-muted-foreground">Temporary Assignment</p>
                        <Badge variant="secondary" className="text-xs">
                          {assignment.assignment_metadata.assignment_type || 'Custom'}
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {assignment.assignment_metadata.program}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{assignment.assignment_metadata.panelist_count.toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(assignment.assignment_metadata.assigned_at).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          // Navigate to survey details
                          window.open(`/admin/surveys/${assignment.survey_id}`, '_blank')
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        disabled={deleting === assignment.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}