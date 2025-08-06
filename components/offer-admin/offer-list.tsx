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
  Edit, 
  Eye, 
  MoreHorizontal,
  Calendar,
  Award,
  Plus,
  Trash2,
  Store
} from 'lucide-react'
import Link from 'next/link'

interface Offer {
  id: string
  title: string
  description?: string
  points_required: number
  merchant_name: string
  offer_details?: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
  redemption_count?: number
}

export function OfferList() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null)

  useEffect(() => {
    fetchOffers()
  }, [])

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/offers?active=all')
      
      if (!response.ok) {
        throw new Error('Failed to fetch offers')
      }
      
      const data = await response.json()
      setOffers(data.offers || [])
    } catch (error) {
      console.error('Error fetching offers:', error)
      setError('Failed to load offers')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOffer = async (offerId: string, offerTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${offerTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingOfferId(offerId)
      
      const response = await fetch(`/api/offers?id=${offerId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete offer')
      }

      // Remove the offer from the local state
      setOffers(prev => prev.filter(offer => offer.id !== offerId))
      
      console.log('Offer deleted successfully')
    } catch (error) {
      console.error('Error deleting offer:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete offer')
    } finally {
      setDeletingOfferId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? "default" : "secondary"}>
        {status ? 'Active' : 'Inactive'}
      </Badge>
    )
  }

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.merchant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (offer.description && offer.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && offer.is_active) ||
                         (filterStatus === 'inactive' && !offer.is_active)
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
          <Button onClick={fetchOffers} variant="outline">
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
            placeholder="Search offers..."
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
            variant={filterStatus === 'inactive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('inactive')}
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || filterStatus !== 'all' 
              ? 'No offers match your search criteria.' 
              : 'No offers found. Create your first offer to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOffers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{offer.title}</h3>
                      {getStatusBadge(offer.is_active)}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {offer.description || 'No description provided'}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span>{offer.points_required} points</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Store className="h-4 w-4" />
                        <span>{offer.merchant_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created {formatDate(offer.created_at)}</span>
                      </div>
                      {offer.redemption_count !== undefined && (
                        <div className="flex items-center gap-1">
                          <span className="text-purple-600 dark:text-purple-400">👥</span>
                          <span>{offer.redemption_count} redemptions</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/admin/offers/${offer.id}/edit`}>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDeleteOffer(offer.id, offer.title)}
                          disabled={deletingOfferId === offer.id}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deletingOfferId === offer.id ? 'Deleting...' : 'Delete Offer'}
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