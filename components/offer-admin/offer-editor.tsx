'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

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

interface OfferEditorProps {
  offerId?: string | Promise<string>
  onBack: () => void
  onSave: () => void
}

export function OfferEditor({ offerId, onBack, onSave }: OfferEditorProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offer, setOffer] = useState<Partial<Offer>>({
    title: '',
    description: '',
    points_required: 100,
    merchant_name: '',
    offer_details: {},
    is_active: true
  })

  const isEditMode = !!offerId

  useEffect(() => {
    if (isEditMode && offerId) {
      const resolveOfferId = async () => {
        const id = typeof offerId === 'string' ? offerId : await offerId
        fetchOffer(id)
      }
      resolveOfferId()
    }
  }, [offerId])

  const fetchOffer = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/offers/${id}`)
      
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

  const handleSave = async () => {
    if (!offer.title || !offer.merchant_name || !offer.points_required) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const url = isEditMode ? `/api/offers?id=${offerId}` : '/api/offers'
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offer),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save offer')
      }

      onSave()
    } catch (error) {
      console.error('Error saving offer:', error)
      setError(error instanceof Error ? error.message : 'Failed to save offer')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof Offer, value: any) => {
    setOffer(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit Offer' : 'Create New Offer'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? 'Update offer details and settings' : 'Create a new merchant offer for panelists to redeem'}
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Offer Form */}
      <Card>
        <CardHeader>
          <CardTitle>Offer Details</CardTitle>
          <CardDescription>
            Configure the offer information and requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={offer.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., $10 Amazon Gift Card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="merchant_name">Merchant Name *</Label>
              <Input
                id="merchant_name"
                value={offer.merchant_name || ''}
                onChange={(e) => handleInputChange('merchant_name', e.target.value)}
                placeholder="e.g., Amazon"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points_required">Points Required *</Label>
              <Input
                id="points_required"
                type="number"
                min="1"
                value={offer.points_required || ''}
                onChange={(e) => handleInputChange('points_required', parseInt(e.target.value) || 0)}
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={offer.is_active || false}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active">
                  {offer.is_active ? 'Active' : 'Inactive'}
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={offer.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the offer details, terms, and conditions..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer_details">Additional Details (JSON)</Label>
            <Textarea
              id="offer_details"
              value={JSON.stringify(offer.offer_details || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  handleInputChange('offer_details', parsed)
                } catch {
                  // Invalid JSON, keep as string for now
                }
              }}
              placeholder='{"terms": "Standard terms apply", "validity": "30 days"}'
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Optional JSON object for additional offer metadata
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : (isEditMode ? 'Update Offer' : 'Create Offer')}
        </Button>
      </div>
    </div>
  )
} 