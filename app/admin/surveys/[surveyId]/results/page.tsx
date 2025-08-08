import { SurveyResults } from '@/components/survey-admin/survey-results'
import { useRouter } from 'next/navigation'

interface SurveyResultsPageProps {
  params: Promise<{ surveyId: string }>
}

export default async function SurveyResultsPage({ params }: SurveyResultsPageProps) {
  const { surveyId } = await params

  return (
    <div className="container mx-auto py-6">
      <SurveyResults 
        surveyId={surveyId}
        onBack={() => {
          // This will be handled by the component's internal navigation
        }}
      />
    </div>
  )
} 