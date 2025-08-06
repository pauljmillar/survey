'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Award, Store, Calendar, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'

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

export default function OfferDetailsPage({ params }: { params: Promise<{ offerId: string }> }) {
  const [offer, setOffer] = useState<Offer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redeeming, setRedeeming] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [redeemError, setRedeemError] = useState<string | null>(null)
  const { isSignedIn } = useAuth()

  useEffect(() => {
    fetchOffer()
  }, [])

  const fetchOffer = async () => {
    try {
      setLoading(true)
      const { offerId } = await params
      const response = await fetch(`/api/offers/${offerId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch offer')
      }
      
      const data = await response.json()
      setOffer(data)
    } catch (error) {
      console.error('Error fetching offer:', error)
      setError('Failed to load offer')
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!offer) return

    setRedeeming(true)
    setRedeemError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offer.id }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess('Redemption successful!')
        setRedeemError(null)
      } else {
        setRedeemError(data.error || 'Redemption failed')
        setSuccess(null)
      }
    } catch (error) {
      setRedeemError('Network error - please try again')
      setSuccess(null)
    } finally {
      setRedeeming(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    )
  }

  if (error || !offer) {
    return (
      <div className="space-y-6 pt-12">
        <div className="flex items-center gap-4">
          <Link href="/offers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Offers
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Offer not found'}</p>
              <Link href="/offers">
                <Button variant="outline">Back to Offers</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/offers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Offers
          </Button>
        </Link>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-200 font-medium">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {redeemError && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-red-800 dark:text-red-200">{redeemError}</p>
          </CardContent>
        </Card>
      )}

      {/* Offer Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{offer.title}</CardTitle>
              <CardDescription className="text-lg mt-2">{offer.merchant_name}</CardDescription>
            </div>
            <Badge variant={offer.is_active ? "default" : "secondary"}>
              {offer.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {offer.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{offer.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">Points Required</p>
                <p className="font-semibold text-lg">{offer.points_required} points</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm text-muted-foreground">Merchant</p>
                <p className="font-semibold">{offer.merchant_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-semibold">
                  {new Date(offer.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {offer.offer_details && Object.keys(offer.offer_details).length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Additional Details</h3>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap break-words">
                  {JSON.stringify(offer.offer_details, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              disabled={!isSignedIn || !offer.is_active || redeeming}
              onClick={handleRedeem}
              className="px-8"
            >
              {redeeming ? 'Processing...' : 'Redeem Offer'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 