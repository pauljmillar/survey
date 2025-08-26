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

// Helper functions (moved outside main component for accessibility)
const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    processing: { color: 'bg-blue-100 text-blue-800', icon: Eye },
    completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
  }
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = config.icon
  
  return (
    <Badge className={config.color}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  )
}

const getApprovalBadge = (isApproved: boolean | null) => {
  if (isApproved === null) {
    return <Badge variant="secondary">Pending</Badge>
  } else if (isApproved) {
    return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
  } else {
    return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
  }
}

// Component for thumbnail with proper error handling and authenticated requests
function ThumbnailImage({ s3Key }: { s3Key: string | null }) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('')

  useEffect(() => {
    if (!s3Key) {
      setImageError(true)
      return
    }

    const fetchImage = async () => {
      try {
        // Fetch the image with authentication
        const response = await fetch(`/api/admin/s3-image/${encodeURIComponent(s3Key)}`, {
          credentials: 'include', // Include cookies for authentication
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        // Convert response to blob
        const blob = await response.blob()
        
        // Create blob URL
        const blobUrl = URL.createObjectURL(blob)
        setImageUrl(blobUrl)
        
        console.log('✅ Image fetched successfully:', s3Key)
      } catch (error) {
        console.error('❌ Failed to fetch image:', s3Key, error)
        setImageError(true)
      }
    }

    fetchImage()

    // Cleanup blob URL on unmount
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [s3Key])

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

  if (!imageUrl) {
    return (
      <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt="Mail package thumbnail"
      className={`w-12 h-12 object-cover rounded border ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => {
        console.log('✅ Image loaded successfully:', s3Key)
        setImageLoaded(true)
      }}
      onError={(e) => {
        console.error('❌ Image failed to load:', {
          s3Key,
          imageUrl,
          error: e,
          timestamp: new Date().toISOString()
        })
        setImageError(true)
      }}
    />
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
  

  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mail Packages</span>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm text-muted-foreground">
              {pagination?.totalCount || 0} total
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by panelist name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={approvalFilter} onValueChange={setApprovalFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Approval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Approval</SelectItem>
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
                      {getStatusBadge(pkg.status)}
                    </TableCell>
                    <TableCell>
                      {getApprovalBadge(pkg.is_approved)}
                    </TableCell>
                    <TableCell>
                      <ThumbnailImage s3Key={pkg.s3_key} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/panels/${pkg.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/panels/${pkg.id}?edit=true`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                                                     {!pkg.is_approved && (
                             <DropdownMenuItem 
                               onClick={async () => {
                                 try {
                                   const response = await fetch(`/api/admin/mail-packages/${pkg.id}`, {
                                     method: 'PATCH',
                                     headers: { 'Content-Type': 'application/json' },
                                     body: JSON.stringify({ 
                                       is_approved: true 
                                     })
                                   })
                                   
                                   if (response.ok) {
                                     // Update the local state to reflect the change
                                     setMailPackages(prev => prev.map(p => 
                                       p.id === pkg.id ? { ...p, is_approved: true } : p
                                     ))
                                   } else {
                                     console.error('Failed to approve package')
                                   }
                                 } catch (error) {
                                   console.error('Error approving package:', error)
                                 }
                               }}
                             >
                               <CheckCircle className="mr-2 h-4 w-4" />
                               Approve
                             </DropdownMenuItem>
                           )}
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