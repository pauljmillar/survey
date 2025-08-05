'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronUp, ChevronDown } from 'lucide-react'

interface Panelist {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  points_balance: number
  total_points_earned: number
  total_points_redeemed: number
  surveys_completed: number
  is_active: boolean
  created_at: string
  last_activity: string
  profile_data: any
}

type SortField = 'name' | 'email' | 'points' | 'surveys' | 'status' | 'activity'
type SortDirection = 'asc' | 'desc'

export default function PanelistsPage() {
  const [panelists, setPanelists] = useState<Panelist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('activity')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filters, setFilters] = useState({
    status: 'all',
    activity: 'all',
    points: 'all'
  })

  useEffect(() => {
    fetchPanelists()
  }, [])

  const fetchPanelists = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/panelists')
      
      if (response.ok) {
        const data = await response.json()
        setPanelists(data.panelists || [])
      } else {
        console.error('Failed to fetch panelists')
      }
    } catch (error) {
      console.error('Error fetching panelists:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  const sortPanelists = (panelists: Panelist[]) => {
    return [...panelists].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase()
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase()
          break
        case 'email':
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case 'points':
          aValue = a.points_balance
          bValue = b.points_balance
          break
        case 'surveys':
          aValue = a.surveys_completed
          bValue = b.surveys_completed
          break
        case 'status':
          aValue = a.is_active ? 1 : 0
          bValue = b.is_active ? 1 : 0
          break
        case 'activity':
          aValue = new Date(a.last_activity).getTime()
          bValue = new Date(b.last_activity).getTime()
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }

  const filteredPanelists = panelists.filter(panelist => {
    const matchesSearch = searchTerm === '' || 
      panelist.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      panelist.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      panelist.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'active' && panelist.is_active) ||
      (filters.status === 'inactive' && !panelist.is_active)

    return matchesSearch && matchesStatus
  })

  const sortedPanelists = sortPanelists(filteredPanelists)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Panelist Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage panelist accounts and view activity
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search panelists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Activity Filter */}
            <div>
              <select
                value={filters.activity}
                onChange={(e) => setFilters(prev => ({ ...prev, activity: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">All Activity</option>
                <option value="recent">Recent (7 days)</option>
                <option value="active">Has Completed Surveys</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Panelist Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading panelists...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Panelist
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70"
                      onClick={() => handleSort('points')}
                    >
                      <div className="flex items-center">
                        Points
                        {getSortIcon('points')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70"
                      onClick={() => handleSort('surveys')}
                    >
                      <div className="flex items-center">
                        Surveys
                        {getSortIcon('surveys')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70"
                      onClick={() => handleSort('activity')}
                    >
                      <div className="flex items-center">
                        Last Activity
                        {getSortIcon('activity')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Demographics
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedPanelists.map((panelist) => (
                    <tr key={panelist.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {panelist.first_name} {panelist.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {panelist.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {panelist.points_balance.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {panelist.surveys_completed}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={panelist.is_active ? "default" : "secondary"}>
                          {panelist.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(panelist.last_activity).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {panelist.profile_data?.age && `Age: ${panelist.profile_data.age}`}
                          {panelist.profile_data?.gender && (
                            <div>Gender: {panelist.profile_data.gender}</div>
                          )}
                          {panelist.profile_data?.location?.country && (
                            <div>Location: {panelist.profile_data.location.country}</div>
                          )}
                          {panelist.profile_data?.interests && panelist.profile_data.interests.length > 0 && (
                            <div>Interests: {panelist.profile_data.interests.slice(0, 2).join(', ')}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
} 