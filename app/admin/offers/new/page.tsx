'use client'

import { OfferEditor } from '@/components/offer-admin/offer-editor'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function CreateOfferPage() {
  const router = useRouter()

  return (
    <div className="space-y-6 pt-12">
      <OfferEditor
        onBack={() => router.push('/admin/offers')}
        onSave={() => router.push('/admin/offers')}
      />
    </div>
  )
} 