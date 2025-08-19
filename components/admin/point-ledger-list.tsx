'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

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
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface PointLedgerListProps {
  ledgerEntries: PointLedgerEntry[]
  pagination: PaginationInfo
  loading: boolean
  onPageChange: (page: number) => void
  getTransactionTypeBadge: (type: string) => React.ReactNode
}

export function PointLedgerList({
  ledgerEntries,
  pagination,
  loading,
  onPageChange,
  getTransactionTypeBadge
}: PointLedgerListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPoints = (points: number) => {
    const sign = points > 0 ? '+' : ''
    return `${sign}${points.toLocaleString()}`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Point Ledger Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Point Ledger Entries</CardTitle>
      </CardHeader>
      <CardContent>
        {ledgerEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No ledger entries found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Panelist</th>
                    <th className="text-left py-3 px-4 font-medium">Points</th>
                    <th className="text-left py-3 px-4 font-medium">Balance</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Title</th>
                    <th className="text-left py-3 px-4 font-medium">Awarded By</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                                             <td className="py-3 px-4">
                         <div>
                           <div className="font-medium">Panelist</div>
                           <div className="text-sm text-gray-500">{entry.panelist_id}</div>
                         </div>
                       </td>
                      <td className="py-3 px-4">
                        <span className={`font-mono ${entry.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPoints(entry.points)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-medium">
                          {entry.balance_after.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getTransactionTypeBadge(entry.transaction_type)}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{entry.title}</div>
                          {entry.description && (
                            <div className="text-sm text-gray-500">{entry.description}</div>
                          )}
                        </div>
                      </td>
                                             <td className="py-3 px-4">
                         {entry.awarded_by || 'System'}
                       </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-sm">{formatDate(entry.created_at)}</div>
                          {entry.effective_date !== entry.created_at.split('T')[0] && (
                            <div className="text-xs text-gray-500">
                              Effective: {entry.effective_date}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} entries
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(pagination.totalPages)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
} 