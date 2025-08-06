'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SurveyCreator } from "@/components/survey-admin/survey-creator"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CreateSurveyPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const router = useRouter()

  const createSampleSurveys = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/setup/sample-surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to create sample surveys' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pt-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/surveys">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Surveys
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Survey</h1>
          <p className="text-muted-foreground mt-2">
            Create a new survey with questions and settings.
          </p>
        </div>
      </div>

      {/* Create New Survey */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Survey</CardTitle>
          <CardDescription>
            Create a new survey with title, description, points reward, and completion time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SurveyCreator 
            onSuccess={() => {
              // Navigate back to surveys list after successful creation
              router.push('/admin/surveys')
            }}
          />
        </CardContent>
      </Card>

      {/* Quick Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup</CardTitle>
          <CardDescription>
            Create sample surveys for testing and demonstration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to create 8 sample surveys with varying points rewards and completion times.
            </p>
            
            <Button 
              onClick={createSampleSurveys} 
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? 'Creating Sample Surveys...' : 'Create Sample Surveys'}
            </Button>
            
            {result && (
              <div className={`p-4 rounded-lg ${
                result.error 
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' 
                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              }`}>
                <h4 className="font-semibold mb-2">
                  {result.error ? 'Error' : 'Success'}
                </h4>
                <p className="text-sm">
                  {result.error || result.message}
                </p>
                {result.results && (
                  <div className="mt-3 text-sm">
                    <h5 className="font-medium mb-1">Results:</h5>
                    <ul className="space-y-1">
                      {result.results.map((item: any, index: number) => (
                        <li key={index} className={`${
                          item.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.success ? '✅' : '❌'} {item.title}
                          {item.success && ` (${item.points} points)`}
                          {item.error && ` - ${item.error}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 