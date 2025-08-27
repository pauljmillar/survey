'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, CheckCircle, XCircle, Clock, Eye, Download, Save, RotateCcw, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { getImageUrl, formatFileSize } from '@/lib/s3-utils'

interface MailScan {
  id: string
  image_filename: string
  s3_key: string
  file_size_bytes: number
  image_sequence: number
  industry: string | null
  mail_type: string | null
  brand_name: string | null
  scan_status: string
  scan_date: string
  processing_notes: string | null
}

interface MailPackage {
  id: string
  panelist_id: string
  package_name: string
  package_description: string | null
  total_images: number
  submission_date: string
  status: string
  points_awarded: number
  is_approved: boolean | null
  reviewed_by: string | null
  review_date: string | null
  processing_notes: string | null
  s3_key: string | null
  industry: string | null
  brand_name: string | null
  company_validated: boolean | null
  response_intention: string | null
  name_check: string | null
  created_at: string
  updated_at: string
  panelist_profiles: {
    user_id: string
    profile_data: {
      first_name?: string
      last_name?: string
      email?: string
    }
  }
  mail_scans: MailScan[]
}

interface MailPackageDetailProps {
  packageId: string
}

// Component for authenticated image display
function AuthenticatedImage({ s3Key, alt, className, onClick }: { s3Key: string; alt: string; className?: string; onClick?: () => void }) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('')

  useEffect(() => {
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
        
        console.log('✅ Detail image fetched successfully:', s3Key)
      } catch (error) {
        console.error('❌ Failed to fetch detail image:', s3Key, error)
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

  if (imageError) {
    return (
      <div className={`bg-muted rounded border flex items-center justify-center ${className}`}>
        <ImageIcon className="w-8 h-8 text-muted-foreground" />
      </div>
    )
  }

  if (!imageUrl) {
    return (
      <div className={`bg-muted rounded border flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      onLoad={() => setImageLoaded(true)}
      onError={() => setImageError(true)}
      onClick={onClick}
    />
  )
}

export function MailPackageDetail({ packageId }: MailPackageDetailProps) {
  const [mailPackage, setMailPackage] = useState<MailPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  // Form state
  const [status, setStatus] = useState('')
  const [pointsAwarded, setPointsAwarded] = useState(0)
  const [isApproved, setIsApproved] = useState<boolean | null>(null)
  const [processingNotes, setProcessingNotes] = useState('')
  const [industry, setIndustry] = useState('')
  const [brandName, setBrandName] = useState('')
  const [companyValidated, setCompanyValidated] = useState(false)
  const [responseIntention, setResponseIntention] = useState('')
  const [nameCheck, setNameCheck] = useState('')
  
  useEffect(() => {
    fetchMailPackage()
  }, [packageId])
  
  const fetchMailPackage = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/mail-packages/${packageId}`)
      const data = await response.json()
      
      if (response.ok) {
        setMailPackage(data.data)
        setStatus(data.data.status)
        setPointsAwarded(data.data.points_awarded)
        setIsApproved(data.data.is_approved)
        setProcessingNotes(data.data.processing_notes || '')
        setIndustry(data.data.industry || '')
        setBrandName(data.data.brand_name || '')
        setCompanyValidated(data.data.company_validated || false)
        setResponseIntention(data.data.response_intention || '')
        setNameCheck(data.data.name_check || '')
      } else {
        console.error('Failed to fetch mail package:', data.error)
      }
    } catch (error) {
      console.error('Error fetching mail package:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/mail-packages/${packageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          points_awarded: pointsAwarded,
          is_approved: isApproved,
          processing_notes: processingNotes,
          industry,
          brand_name: brandName,
          company_validated: companyValidated,
          response_intention: responseIntention,
          name_check: nameCheck
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMailPackage(data.data)
        // Show success message or toast
      } else {
        console.error('Failed to update mail package:', data.error)
      }
    } catch (error) {
      console.error('Error updating mail package:', error)
    } finally {
      setSaving(false)
    }
  }
  
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
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading mail package...</p>
        </div>
      </div>
    )
  }
  
  if (!mailPackage) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Mail package not found</p>
        <Link href="/admin/panels">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Mail Packages
          </Button>
        </Link>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/panels">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Mail Package Details</h1>
            <p className="text-muted-foreground">
              Submitted {formatDate(mailPackage.submission_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(mailPackage.status)}
          {getApprovalBadge(mailPackage.is_approved)}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Package Info & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Panelist Info */}
          <Card>
            <CardHeader>
              <CardTitle>Panelist Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                             <div>
                 <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                 <p className="font-medium">
                   {mailPackage.panelist_profiles?.profile_data?.first_name || 'Unknown'} {mailPackage.panelist_profiles?.profile_data?.last_name || 'User'}
                 </p>
               </div>
               <div>
                 <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                 <p>{mailPackage.panelist_profiles?.profile_data?.email || 'No email'}</p>
               </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Total Images</Label>
                <p>{mailPackage.total_images} images</p>
              </div>
              {/* Removed users field from here */}
            </CardContent>
          </Card>
          
          {/* Review Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Review & Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="approval">Approval</Label>
                <Select 
                  value={isApproved === null ? 'pending' : isApproved ? 'true' : 'false'} 
                  onValueChange={(value) => setIsApproved(value === 'pending' ? null : value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="true">Approve</SelectItem>
                    <SelectItem value="false">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="points">Points to Award</Label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={pointsAwarded}
                  onChange={(e) => setPointsAwarded(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Processing Notes</Label>
                <Textarea
                  id="notes"
                  value={processingNotes}
                  onChange={(e) => setProcessingNotes(e.target.value)}
                  placeholder="Add notes about this mail package..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g., banking, retail, insurance"
                />
              </div>
              
              <div>
                <Label htmlFor="brand">Brand Name</Label>
                <Input
                  id="brand"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g., Citibank, Walmart"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="company_validated"
                  checked={companyValidated}
                  onChange={(e) => setCompanyValidated(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="company_validated">Company Validated</Label>
              </div>
              
              <div>
                <Label htmlFor="response_intention">Response Intention</Label>
                <Input
                  id="response_intention"
                  value={responseIntention}
                  onChange={(e) => setResponseIntention(e.target.value)}
                  placeholder="e.g., interested, not interested, maybe"
                />
              </div>
              
              <div>
                <Label htmlFor="name_check">Name Check</Label>
                <Input
                  id="name_check"
                  value={nameCheck}
                  onChange={(e) => setNameCheck(e.target.value)}
                  placeholder="Name validation result"
                />
              </div>
              
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Images */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Scanned Images ({mailPackage.mail_scans.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mailPackage.mail_scans
                  .sort((a, b) => a.image_sequence - b.image_sequence)
                  .map((scan) => (
                    <div key={scan.id} className="space-y-2">
                      <div className="relative group">
                        <AuthenticatedImage
                          s3Key={scan.s3_key}
                          alt={scan.image_filename}
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedImage(scan.s3_key)}
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs">
                            {scan.image_sequence}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium truncate">{scan.image_filename}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(scan.file_size_bytes)}</p>
                        {scan.brand_name && (
                          <p className="text-xs text-muted-foreground">Brand: {scan.brand_name}</p>
                        )}
                        {scan.industry && (
                          <p className="text-xs text-muted-foreground">Industry: {scan.industry}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Full Size Image</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedImage(null)}
              >
                ×
              </Button>
            </div>
            <div className="p-4">
              <AuthenticatedImage
                s3Key={selectedImage}
                alt="Full size"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 