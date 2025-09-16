'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface LedgerEntry {
  points: number
  transaction_type: string
  title: string
  description: string | null
  created_at: string
}

interface ApiResponse {
  ledgerEntries: LedgerEntry[]
  pagination: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
}

export default function TestApiPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState('10')
  const [offset, setOffset] = useState('0')
  const [transactionType, setTransactionType] = useState('all')

  const testApi = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const params = new URLSearchParams({
        limit,
        offset,
        ...(transactionType !== 'all' && { transactionType })
      })

      const response = await fetch(`/api/panelist/point-ledger?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
      console.log('API Response:', data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('API Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Point Ledger API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="limit">Limit</Label>
              <Input
                id="limit"
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                min="1"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="offset">Offset</Label>
              <Input
                id="offset"
                type="number"
                value={offset}
                onChange={(e) => setOffset(e.target.value)}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="transactionType">Transaction Type</Label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="survey_completion">Survey Completion</SelectItem>
                  <SelectItem value="manual_award">Manual Award</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="redemption">Redemption</SelectItem>
                  <SelectItem value="account_signup_bonus">Signup Bonus</SelectItem>
                  <SelectItem value="app_download_bonus">App Download Bonus</SelectItem>
                  <SelectItem value="mail_package_scan">Mail Package Scan</SelectItem>
                  <SelectItem value="mail_package_review">Mail Package Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={testApi} disabled={loading}>
            {loading ? 'Testing...' : 'Test API'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>API Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Pagination Info:</h4>
                <pre className="bg-gray-100 p-2 rounded text-sm">
                  {JSON.stringify(result.pagination, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Ledger Entries ({result.ledgerEntries.length}):</h4>
                {result.ledgerEntries.length === 0 ? (
                  <p className="text-gray-500">No ledger entries found</p>
                ) : (
                  <div className="space-y-2">
                    {result.ledgerEntries.map((entry, index) => (
                      <div key={index} className="border p-3 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{entry.title}</p>
                            <p className="text-sm text-gray-600">{entry.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(entry.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${entry.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {entry.points > 0 ? '+' : ''}{entry.points} points
                            </p>
                            <p className="text-xs text-gray-500">{entry.transaction_type}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
