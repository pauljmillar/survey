'use client'

import { ContestForm } from '@/components/admin/contest-form'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateContestPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/contests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contests
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Contest</h1>
            <p className="text-muted-foreground mt-2">
              Create a new contest with start/end dates, prizes, and participant selection.
            </p>
          </div>
        </div>

        <ContestForm />
      </div>
    </div>
  )
}

