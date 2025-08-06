'use client'

import { OfferEditor } from '@/components/offer-admin/offer-editor'
import { useRouter } from 'next/navigation'

export default function EditOfferPage({ params }: { params: Promise<{ offerId: string }> }) {
  const router = useRouter()

  return (
    <div className="space-y-6 pt-12">
      <OfferEditor
        offerId={Promise.resolve(params).then(p => p.offerId)}
        onBack={() => router.push('/admin/offers')}
        onSave={() => router.push('/admin/offers')}
      />
    </div>
  )
} 