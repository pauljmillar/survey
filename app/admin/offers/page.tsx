'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OfferList } from "@/components/offer-admin/offer-list"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function AdminOffersPage() {
  return (
    <div className="space-y-6 pt-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offer Management</h1>
          <p className="text-muted-foreground mt-3">
            Create and manage merchant offers and rewards.
          </p>
        </div>
        <Link href="/admin/offers/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Offer
          </Button>
        </Link>
      </div>

      {/* Existing Offers List */}
      <OfferList />
    </div>
  )
} 