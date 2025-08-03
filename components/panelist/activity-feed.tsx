"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { useRealtime } from '@/hooks/use-realtime'

interface Activity {
  id: string
  activity_type: string
  description: string
  metadata?: Record<string, any>
  created_at: string
}

const ACTIVITY_TYPES = [
  { label: "All", value: "" },
  { label: "Surveys", value: "survey_completed" },
  { label: "Redemptions", value: "redemption" },
  { label: "Points", value: "points" },
]

type SortOption = "newest" | "oldest"

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState("")
  const [sort, setSort] = useState<SortOption>("newest")
  const [search, setSearch] = useState("")

  // Real-time subscription for activity updates
  const { isConnected: isRealtimeConnected } = useRealtime(
    { enableActivityFeed: true },
    {
      onActivityUpdate: (newActivity) => {
        // Add new activity to the top of the list
        setActivities(prev => [newActivity, ...prev])
      },
    }
  )

  useEffect(() => {
    fetchActivities()
    // eslint-disable-next-line
  }, [type])

  const fetchActivities = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (type) params.append("type", type)
      const res = await fetch(`/api/activity?${params.toString()}`)
      const data = await res.json()
      setActivities(data.activities || [])
    } catch (e) {
      setError("Failed to load activity log")
    } finally {
      setLoading(false)
    }
  }

  // Filter by search
  const filtered = activities.filter(
    (a) =>
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      (a.metadata && JSON.stringify(a.metadata).toLowerCase().includes(search.toLowerCase()))
  )

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    return 0
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-black dark:text-white">Activity Log</h1>
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
        <Input
          placeholder="Search activity..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="md:w-64"
        />
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="border rounded px-3 py-2 bg-white dark:bg-black text-black dark:text-white"
        >
          {ACTIVITY_TYPES.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortOption)}
          className="border rounded px-3 py-2 bg-white dark:bg-black text-black dark:text-white"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        <Button variant="outline" onClick={fetchActivities}>Refresh</Button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
        </div>
      ) : error ? (
        <EmptyState
          title="Error loading activity log"
          message={error}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No Activity Found"
          message="No activity records match your criteria."
        />
      ) : (
        <div className="space-y-4">
          {sorted.map((a) => (
            <Card key={a.id} className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(a.created_at).toLocaleString()}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                  {a.activity_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              </div>
              <div className="text-sm text-black dark:text-white font-medium">{a.description}</div>
              {a.metadata && (
                <details className="text-xs text-gray-500 mt-1">
                  <summary className="cursor-pointer">Details</summary>
                  <pre className="whitespace-pre-wrap break-words bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1">{JSON.stringify(a.metadata, null, 2)}</pre>
                </details>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 