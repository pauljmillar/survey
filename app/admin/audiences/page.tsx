'use client'

import { AudienceBuilder } from '@/components/admin/audience-builder'

export default function AudiencesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Audience Management</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage targeted audiences for your surveys
          </p>
        </div>

        <AudienceBuilder />
      </div>
    </div>
  )
}