'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Edit, 
  Trash2, 
  Search, 
  Award, 
  Store, 
  Calendar,
  MoreHorizontal,
  Eye
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
}

export function OfferList() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchOffers()
  }, [])

  const fetchOffers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/offers')
      const data = await response.json()
      setOffers(data.offers || [])
    } catch (error) {
      console.error('Error fetching offers:', error)
      setError('Failed to load offers')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return

    try {
      setDeletingId(offerId)
      const response = await fetch(`/api/offers?id=${offerId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setOffers(prev => prev.filter(offer => offer.id !== offerId))
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete offer')
      }
    } catch (error) {
      console.error('Error deleting offer:', error)
      alert('Failed to delete offer')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (offer: Offer) => {
    try {
      const response = await fetch(`/api/offers?id=${offer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...offer, is_active: !offer.is_active }),
      })

      if (response.ok) {
        setOffers(prev => prev.map(o => 
          o.id === offer.id ? { ...o, is_active: !o.is_active } : o
        ))
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update offer')
      }
    } catch (error) {
      console.error('Error updating offer:', error)
      alert('Failed to update offer')
    }
  }

  // Filter by search
  const filtered = offers.filter(
    (offer) =>
      offer.title.toLowerCase().includes(search.toLowerCase()) ||
      offer.merchant_name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchOffers} variant="outline">Retry</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search offers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Offers List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {search ? 'No offers match your search.' : 'No offers found. Create your first offer to get started.'}
              </p>
              {!search && (
                <Link href="/admin/offers/new">
                  <Button>Create First Offer</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((offer) => (
            <Card key={offer.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{offer.title}</h3>
                      <Badge variant={offer.is_active ? "default" : "secondary"}>
                        {offer.is_active ? 'Active' : 'Inactive'}
                      </Badge>
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
                        <span>Created {new Date(offer.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/offers/${offer.id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(offer)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {offer.is_active ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(offer.id)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 