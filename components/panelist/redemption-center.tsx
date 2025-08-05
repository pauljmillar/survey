"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty-state"
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

  useEffect(() => {
    fetchOffers()
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
              <Button
                variant="default"
                className="mt-4 w-full"
                disabled={!isSignedIn || redeemingId === offer.id}
                onClick={() => handleRedeem(offer)}
              >
                {redeemingId === offer.id ? 'Processing...' : 'Redeem'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 