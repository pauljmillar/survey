'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Loader2 } from 'lucide-react'

interface PanelistBalance {
  panelist_id: string
  email: string
  first_name: string
  last_name: string
  current_balance: number
}

interface PointAwardFormProps {
  onClose: () => void
  onAwardCreated: () => void
}

export function PointAwardForm({ onClose, onAwardCreated }: PointAwardFormProps) {
  const [panelists, setPanelists] = useState<PanelistBalance[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    panelistId: '',
    points: '',
    transactionType: 'manual_award',
    title: '',
    description: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchPanelists()
  }, [])

  const fetchPanelists = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/panelist-balances')
      const data = await response.json()

      if (response.ok) {
        setPanelists(data.panelistBalances)
      } else {
        console.error('Error fetching panelists:', data.error)
      }
    } catch (error) {
      console.error('Error fetching panelists:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.panelistId || !formData.points || !formData.title) {
      alert('Please fill in all required fields')
      return
    }

    const points = parseInt(formData.points)
    if (isNaN(points) || points <= 0) {
      alert('Points must be a positive number')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/point-ledger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          panelistId: formData.panelistId,
          points: points,
          transactionType: formData.transactionType,
          title: formData.title,
          description: formData.description || null,
          effectiveDate: formData.effectiveDate
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onAwardCreated()
      } else {
        alert(`Error creating award: ${data.error}`)
      }
    } catch (error) {
      console.error('Error creating award:', error)
      alert('Error creating award. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPanelist = panelists.find(p => p.panelist_id === formData.panelistId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Create Point Award</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Panelist Selection */}
            <div className="space-y-2">
              <Label htmlFor="panelist">Panelist *</Label>
              <Select
                value={formData.panelistId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, panelistId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a panelist" />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading panelists...
                      </div>
                    </SelectItem>
                  ) : (
                    panelists.map((panelist) => (
                      <SelectItem key={panelist.panelist_id} value={panelist.panelist_id}>
                        <div className="flex justify-between items-center w-full">
                          <span>
                            {panelist.first_name} {panelist.last_name}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({panelist.current_balance} pts)
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedPanelist && (
                <div className="text-sm text-gray-500">
                  Current balance: {selectedPanelist.current_balance.toLocaleString()} points
                </div>
              )}
            </div>

            {/* Points */}
            <div className="space-y-2">
              <Label htmlFor="points">Points *</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: e.target.value }))}
                placeholder="Enter points to award"
              />
            </div>

            {/* Transaction Type */}
            <div className="space-y-2">
              <Label htmlFor="transactionType">Transaction Type *</Label>
              <Select
                value={formData.transactionType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, transactionType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual_award">Manual Award</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="survey_completion">Survey Completion</SelectItem>
                  <SelectItem value="referral_bonus">Referral Bonus</SelectItem>
                  <SelectItem value="weekly_bonus">Weekly Bonus</SelectItem>
                  <SelectItem value="system_adjustment">System Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Bonus for completing more than 4 surveys in a week"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional additional details..."
                rows={3}
              />
            </div>

            {/* Effective Date */}
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Award'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 