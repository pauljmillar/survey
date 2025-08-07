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

export function RedemptionCenter() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
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
  
  // Redemption history state
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

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
      if (res.ok) {
        setRedemptions(data.redemptions || [])
      } else {
        console.error('Failed to load redemption history:', data.error)
      }
    } catch (e) {
      console.error('Error loading redemption history:', e)
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
        fetchRedemptions(); // Refresh redemption history
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

  return (
    <div className="space-y-6">
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

      {/* Redemption History Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black dark:text-white">Redemption History</h2>
          <Badge variant="outline" className="text-sm">
            {redemptions.length} {redemptions.length === 1 ? 'redemption' : 'redemptions'}
          </Badge>
        </div>

        {historyLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
          </div>
        ) : redemptions.length === 0 ? (
          <EmptyState
            title="No Redemptions Yet"
            message="You haven't redeemed any offers yet. Complete surveys to earn points and start redeeming rewards!"
          />
        ) : (
          <div className="space-y-4">
            {redemptions.map((redemption) => (
              <Card key={redemption.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-black dark:text-white">
                        {redemption.merchant_offers.title}
                      </h3>
                      <Badge 
                        variant={redemption.status === 'completed' ? 'default' : 
                                redemption.status === 'pending' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {redemption.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {redemption.merchant_offers.merchant_name}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      Points spent: <span className="font-bold">{redemption.points_spent}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(redemption.redemption_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {redemption.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {redemption.status === 'pending' && (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    )}
                    {redemption.status === 'cancelled' && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
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