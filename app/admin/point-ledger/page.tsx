'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Filter, ArrowUpDown } from 'lucide-react'
import { PointLedgerList } from '@/components/admin/point-ledger-list'
import { PointAwardForm } from '@/components/admin/point-award-form'

interface PointLedgerEntry {
  id: string
  panelist_id: string
  points: number
  balance_after: number
  transaction_type: string
  title: string
  description: string | null
  metadata: any
  awarded_by: string | null
  created_at: string
  effective_date: string
  panelist_profiles: {
    profile_data: {
      first_name: string
      last_name: string
    }
  }
  awarded_by_user: {
    email: string
  } | null
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function PointLedgerPage() {
  const [ledgerEntries, setLedgerEntries] = useState<PointLedgerEntry[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [transactionType, setTransactionType] = useState('all')
  const [panelistId, setPanelistId] = useState('all')
  const [showAwardForm, setShowAwardForm] = useState(false)

  const fetchLedgerEntries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        transactionType,
        panelistId
      })

      const response = await fetch(`/api/admin/point-ledger?${params}`)
      const data = await response.json()

      if (response.ok) {
        setLedgerEntries(data.ledgerEntries)
        setPagination(data.pagination)
      } else {
        console.error('Error fetching ledger entries:', data.error)
      }
    } catch (error) {
      console.error('Error fetching ledger entries:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLedgerEntries()
  }, [pagination.page, search, transactionType, panelistId])

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleTransactionTypeChange = (value: string) => {
    setTransactionType(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePanelistIdChange = (value: string) => {
    setPanelistId(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleAwardCreated = () => {
    setShowAwardForm(false)
    fetchLedgerEntries()
  }

  const getTransactionTypeBadge = (type: string) => {
    const typeConfig = {
      award: { color: 'bg-green-100 text-green-800', label: 'Award' },
      redemption: { color: 'bg-red-100 text-red-800', label: 'Redemption' },
      bonus: { color: 'bg-blue-100 text-blue-800', label: 'Bonus' },
      survey_completion: { color: 'bg-purple-100 text-purple-800', label: 'Survey' },
      manual_award: { color: 'bg-orange-100 text-orange-800', label: 'Manual' },
      system_adjustment: { color: 'bg-gray-100 text-gray-800', label: 'Adjustment' },
      referral_bonus: { color: 'bg-pink-100 text-pink-800', label: 'Referral' },
      weekly_bonus: { color: 'bg-indigo-100 text-indigo-800', label: 'Weekly' }
    }

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.award
    return <Badge className={config.color}>{config.label}</Badge>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Point Ledger</h1>
        <Button onClick={() => setShowAwardForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Award
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or title..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction Type</label>
              <Select value={transactionType} onValueChange={handleTransactionTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="award">Award</SelectItem>
                  <SelectItem value="redemption">Redemption</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="survey_completion">Survey Completion</SelectItem>
                  <SelectItem value="manual_award">Manual Award</SelectItem>
                  <SelectItem value="system_adjustment">System Adjustment</SelectItem>
                  <SelectItem value="referral_bonus">Referral Bonus</SelectItem>
                  <SelectItem value="weekly_bonus">Weekly Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Panelist</label>
              <Select value={panelistId} onValueChange={handlePanelistIdChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Panelists</SelectItem>
                  {/* We'll populate this with actual panelists */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <PointLedgerList
        ledgerEntries={ledgerEntries}
        pagination={pagination}
        loading={loading}
        onPageChange={handlePageChange}
        getTransactionTypeBadge={getTransactionTypeBadge}
      />

      {/* Award Form Modal */}
      {showAwardForm && (
        <PointAwardForm
          onClose={() => setShowAwardForm(false)}
          onAwardCreated={handleAwardCreated}
        />
      )}
    </div>
  )
} 