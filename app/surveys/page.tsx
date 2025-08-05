'use client'

import { SurveyList } from '@/components/panelist/survey-list'

export default function SurveysPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Available Surveys</h1>
        <p className="mt-1 text-muted-foreground">
          Complete surveys to earn points and share your valuable opinions
        </p>
      </div>

      {/* Survey List */}
      <SurveyList 
        limit={10}
        showFilters={true}
        showPagination={true}
      />
    </div>
  )
} 