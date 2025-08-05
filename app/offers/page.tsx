'use client'

import { RedemptionCenter } from '@/components/panelist/redemption-center'

export default function OffersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Redeem Your Points</h1>
        <p className="mt-1 text-muted-foreground">
          Browse and redeem your earned points for exciting rewards
        </p>
      </div>

      {/* Redemption Center */}
      <RedemptionCenter />
    </div>
  )
} 