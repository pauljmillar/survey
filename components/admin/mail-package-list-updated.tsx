'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, ChevronUp, ChevronDown, Image, MoreHorizontal, Edit } from 'lucide-react'
import Link from 'next/link'
import { formatFileSize, getThumbnailUrl, getPlaceholderImageUrl } from '@/lib/s3-utils'

interface MailPackage {
  id: string
  panelist_id: string
  total_images: number
  submission_date: string
  status: string
  points_awarded: number
  is_approved: boolean | null
  s3_key: string | null
  created_at: string
  panelist_profiles: {
    user_id: string
    profile_data: {
      first_name?: string
      last_name?: string
      email?: string
    }
  }
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Component for thumbnail with proper error handling
function ThumbnailImage({ s3Key }: { s3Key: string | null }) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  if (!s3Key) {
    return (
      <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
        <span className="text-xs text-muted-foreground">No image</span>
      </div>
    )
  }

  if (imageError) {
    return (
      <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
        <Image className="w-4 h-4 text-muted-foreground" />
      </div>
    )
  }

  return (
    <img
      src={getThumbnailUrl(s3Key, 60, 60)}
      alt="Mail package thumbnail"
      className={`w-12 h-12 object-cover rounded border ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => setImageLoaded(true)}
      onError={() => setImageError(true)}
    />
  )
}

// Component for inline status editing
function EditableStatus({ status, packageId, onUpdate }: { status: string; packageId: string; onUpdate: (id: string, status: string) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(status)

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/admin/mail-packages/${packageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: currentStatus })
      })

      if (response.ok) {
        onUpdate(packageId, currentStatus)
        setIsEditing(false)
      } else {
        console.error('Failed to update status')
        setCurrentStatus(status) // Revert on error
      }
    } catch (error) {
      console.error('Error updating status:', error)
      setCurrentStatus(status) // Revert on error
    }
  }

  const handleCancel = () => {
    setCurrentStatus(status)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Select value={currentStatus} onValueChange={setCurrentStatus}>
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" onClick={handleSave} className="h-6 w-6 p-0">
          <CheckCircle className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 w-6 p-0">
          <XCircle className="w-3 h-3" />
        </Button>
      </div>
    )
  }

  return (
    <div 
      className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1"
      onClick={() => setIsEditing(true)}
    >
      {getStatusBadge(currentStatus)}
    </div>
  )
}

// Component for inline approval editing
function EditableApproval({ isApproved, packageId, onUpdate }: { isApproved: boolean | null; packageId: string; onUpdate: (id: string, isApproved: boolean | null) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentApproval, setCurrentApproval] = useState(isApproved)

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/admin/mail-packages/${packageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: currentApproval })
      })

      if (response.ok) {
        onUpdate(packageId, currentApproval)
        setIsEditing(false)
      } else {
        console.error('Failed to update approval')
        setCurrentApproval(isApproved) // Revert on error
      }
    } catch (error) {
      console.error('Error updating approval:', error)
      setCurrentApproval(isApproved) // Revert on error
    }
  }

  const handleCancel = () => {
    setCurrentApproval(isApproved)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Select value={currentApproval === null ? 'pending' : currentApproval ? 'approved' : 'rejected'} onValueChange={(value) => {
          if (value === 'pending') setCurrentApproval(null)
          else if (value === 'approved') setCurrentApproval(true)
          else setCurrentApproval(false)
        }}>
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" onClick={handleSave} className="h-6 w-6 p-0">
          <CheckCircle className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 w-6 p-0">
          <XCircle className="w-3 h-3" />
        </Button>
      </div>
    )
  }

  return (
    <div 
      className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1"
      onClick={() => setIsEditing(true)}
    >
      {getApprovalBadge(currentApproval)}
    </div>
  )
}

export function MailPackageList() {
  const [mailPackages, setMailPackages] = useState<MailPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  
  // Filters and search
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [approvalFilter, setApprovalFilter] = useState('all')
  const [sortBy, setSortBy] = useState('submission_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search])
  
  useEffect(() => {
    fetchMailPackages()
  }, [debouncedSearch, statusFilter, approvalFilter, sortBy, sortOrder])
  
  const fetchMailPackages = async (page: number = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: debouncedSearch,
        status: statusFilter === 'all' ? '' : statusFilter,
        is_approved: approvalFilter === 'all' ? '' : approvalFilter,
        sort_by: sortBy,
        sort_order: sortOrder
      })
      
      const response = await fetch(`/api/admin/mail-packages?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setMailPackages(data.data)
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch mail packages:', data.error)
      }
    } catch (error) {
      console.error('Error fetching mail packages:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }
  
  const handleStatusUpdate = (packageId: string, newStatus: string) => {
    setMailPackages(prev => prev.map(pkg => 
      pkg.id === packageId ? { ...pkg, status: newStatus } : pkg
    ))
  }
  
  const handleApprovalUpdate = (packageId: string, newApproval: boolean | null) => {
    setMailPackages(prev => prev.map(pkg => 
      pkg.id === packageId ? { ...pkg, is_approved: newApproval } : pkg
    ))
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }
  
  const getApprovalBadge = (isApproved: boolean | null) => {
    if (isApproved === null) {
      return <Badge variant="outline">Pending</Badge>
    } else if (isApproved) {
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
    }
  }
  
  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mail Packages</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by panelist name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={approvalFilter} onValueChange={setApprovalFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Approval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Approvals</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="true">Approved</SelectItem>
              <SelectItem value="false">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('submission_date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <SortIcon column="submission_date" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Panelist
                  </div>
                </TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Thumbnail</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : mailPackages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No mail packages found
                  </TableCell>
                </TableRow>
              ) : (
                mailPackages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">
                      {formatDate(pkg.submission_date)}
                    </TableCell>
                    <TableCell>
                       <div>
                         <div className="font-medium">
                           {pkg.panelist_profiles.profile_data.first_name || 'Unknown'} {pkg.panelist_profiles.profile_data.last_name || 'User'}
                         </div>
                         <div className="text-sm text-muted-foreground">
                           {pkg.panelist_profiles.profile_data.email || 'No email'}
                         </div>
                       </div>
                     </TableCell>
                    <TableCell>
                      <Badge variant="outline">{pkg.total_images} images</Badge>
                    </TableCell>
                    <TableCell>
                      <EditableStatus 
                        status={pkg.status} 
                        packageId={pkg.id} 
                        onUpdate={handleStatusUpdate}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableApproval 
                        isApproved={pkg.is_approved} 
                        packageId={pkg.id} 
                        onUpdate={handleApprovalUpdate}
                      />
                    </TableCell>
                    <TableCell>
                      <ThumbnailImage s3Key={pkg.s3_key} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/panels/${pkg.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/panels/${pkg.id}?edit=true`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Package
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
              {pagination.totalCount} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrev}
                onClick={() => fetchMailPackages(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNext}
                onClick={() => fetchMailPackages(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 