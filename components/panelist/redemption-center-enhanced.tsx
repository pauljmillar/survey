"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/hooks/use-auth'
import { Clock, CheckCircle, XCircle, Calendar } from 'lucide-react'

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

interface Redemption {
  id: string
  points_spent: number
  status: 'pending' | 'completed' | 'cancelled'
  redemption_date: string
  created_at: string
  merchant_offers: {
    id: string
    title: string
    description?: string
    merchant_name: string
    offer_details?: Record<string, any>
  }
}

type SortOption = "points_asc" | "points_desc" | "newest" | "oldest"

export function RedemptionCenterEnhanced() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("points_asc")
  const [minPoints, setMinPoints] = useState("")
  const [maxPoints, setMaxPoints] = useState("")
  const { isSignedIn } = useAuth();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    fetchOffers()
    fetchRedemptions()
    // eslint-disable-next-line
  }, [minPoints, maxPoints])

  const fetchOffers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (minPoints) params.append("min_points", minPoints)
      if (maxPoints) params.append("max_points", maxPoints)
      const res = await fetch(`/api/offers?${params.toString()}`)
      const data = await res.json()
      setOffers(data.offers || [])
    } catch (e) {
      setError("Failed to load offers")
    } finally {
      setLoading(false)
    }
  }

  const fetchRedemptions = async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/redemptions')
      const data = await res.json()
      setRedemptions(data.redemptions || [])
    } catch (e) {
      console.error('Failed to load redemption history:', e)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleRedeem = async (offer: Offer) => {
    setRedeemingId(offer.id);
    setRedeemError(null);
    setSuccess(null);
    setReceipt(null);
    try {
      const res = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offer.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Redemption successful!');
        setReceipt(data);
        fetchOffers(); // Refresh offers in case of changes
        fetchRedemptions(); // Refresh history
      } else {
        setRedeemError(data.error || 'Redemption failed');
      }
    } catch (e) {
      setRedeemError('Network error - please try again');
    } finally {
      setRedeemingId(null);
    }
  };

  // Filter by search
  const filtered = offers.filter(
    (offer) =>
      offer.title.toLowerCase().includes(search.toLowerCase()) ||
      offer.merchant_name.toLowerCase().includes(search.toLowerCase())
  )

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "points_asc") return a.points_required - b.points_required
    if (sort === "points_desc") return b.points_required - a.points_required
    if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    return 0
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && receipt && (
        <div className="p-4 rounded bg-green-50 border border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-100">
          <div className="font-semibold mb-1">Redemption Successful!</div>
          <div>Points Spent: <span className="font-bold">{receipt.points_spent}</span></div>
          <div>New Balance: <span className="font-bold">{receipt.new_balance}</span></div>
          <div>Redemption ID: <span className="font-mono">{receipt.redemption_id}</span></div>
        </div>
      )}
      
      {redeemError && (
        <div className="p-4 rounded bg-red-50 border border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-100">
          <div className="font-semibold mb-1">Redemption Failed</div>
          <div>{redeemError}</div>
        </div>
      )}

      {/* Available Offers Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <Input
            placeholder="Search offers or merchants..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="md:w-64"
          />
          <Input
            placeholder="Min points"
            type="number"
            value={minPoints}
            onChange={e => setMinPoints(e.target.value)}
            className="md:w-32"
          />
          <Input
            placeholder="Max points"
            type="number"
            value={maxPoints}
            onChange={e => setMaxPoints(e.target.value)}
            className="md:w-32"
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            className="border rounded px-3 py-2 bg-white dark:bg-black text-black dark:text-white"
          >
            <option value="points_asc">Points: Low to High</option>
            <option value="points_desc">Points: High to Low</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
          <Button variant="outline" onClick={fetchOffers}>Apply Filters</Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
          </div>
        ) : error ? (
          <EmptyState
            title="Error loading offers"
            message={error}
          />
        ) : sorted.length === 0 ? (
          <EmptyState
            title="No Offers Found"
            message="There are no offers matching your criteria. Try adjusting your filters."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((offer) => (
              <Card key={offer.id} className="p-6 flex flex-col justify-between h-full">
                <div>
                  <h2 className="text-lg font-semibold text-black dark:text-white mb-1">{offer.title}</h2>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">{offer.merchant_name}</div>
                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-4 min-h-[48px]">{offer.description || "No description provided."}</div>
                  <div className="text-xs text-gray-500 mb-2">Points Required: <span className="font-bold text-black dark:text-white">{offer.points_required}</span></div>
                  {offer.offer_details && (
                    <details className="text-xs text-gray-500 mb-2">
                      <summary className="cursor-pointer">Details</summary>
                      <pre className="whitespace-pre-wrap break-words bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1">{JSON.stringify(offer.offer_details, null, 2)}</pre>
                    </details>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(`/offers/${offer.id}`, '_blank')}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1"
                    disabled={!isSignedIn || redeemingId === offer.id}
                    onClick={() => handleRedeem(offer)}
                  >
                    {redeemingId === offer.id ? 'Processing...' : 'Redeem'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Redemption History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Redemption History</h2>
          <Button 
            variant="outline" 
            onClick={fetchRedemptions}
            disabled={historyLoading}
          >
            {historyLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {historyLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : redemptions.length === 0 ? (
          <Card className="p-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Redemptions Yet</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Your redemption history will appear here once you redeem your first offer.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {redemptions.map((redemption) => (
              <Card key={redemption.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{redemption.merchant_offers.title}</h3>
                      <Badge className={getStatusColor(redemption.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(redemption.status)}
                          <span className="capitalize">{redemption.status}</span>
                        </div>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {redemption.merchant_offers.merchant_name}
                    </p>
                    {redemption.merchant_offers.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        {redemption.merchant_offers.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Points Spent: <span className="font-semibold">{redemption.points_spent}</span></span>
                      <span>Date: <span className="font-semibold">
                        {new Date(redemption.created_at).toLocaleDateString()}
                      </span></span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 