'use client'

import { PanelistGuard } from '@/components/auth/auth-guard'
import { SurveyList } from '@/components/panelist/survey-list'
import { PointsBadge } from '@/components/panelist/points-display'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SurveysPage() {
  return (
    <PanelistGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Available Surveys</h1>
                <p className="mt-1 text-muted-foreground">
                  Complete surveys to earn points and share your valuable opinions
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center gap-4">
                <PointsBadge />
                <Link href="/dashboard">
                  <Button variant="outline">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-8 lg:grid-cols-4">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Survey Tips</h2>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start">
                    <span className="text-blue-600 dark:text-blue-400 mr-2">💡</span>
                    <p className="text-muted-foreground">
                      Answer honestly and thoughtfully for the best experience
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="text-green-600 dark:text-green-400 mr-2">⚡</span>
                    <p className="text-muted-foreground">
                      Shorter surveys are great for quick points
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="text-purple-600 dark:text-purple-400 mr-2">🎯</span>
                    <p className="text-muted-foreground">
                      Complete your profile for more targeted opportunities
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="text-orange-600 dark:text-orange-400 mr-2">🏆</span>
                    <p className="text-muted-foreground">
                      Higher point surveys usually require more detailed responses
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="font-medium text-foreground mb-2">Quick Actions</h3>
                  <div className="space-y-2">
                    <Link href="/offers" className="block">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        🏪 Browse Rewards
                      </Button>
                    </Link>
                    <Link href="/activity" className="block">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        📊 View Activity
                      </Button>
                    </Link>
                    <Link href="/profile" className="block">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        ⚙️ Update Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>

            {/* Survey List */}
            <div className="lg:col-span-3">
              <SurveyList 
                limit={10}
                showFilters={true}
                showPagination={true}
              />
            </div>
          </div>
        </div>
      </div>
    </PanelistGuard>
  )
} 