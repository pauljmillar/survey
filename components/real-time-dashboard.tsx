import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RealTimePoints } from '@/components/panelist/real-time-points'
import { RealTimeActivity } from '@/components/panelist/real-time-activity'
import { RealTimeSurveys } from '@/components/panelist/real-time-surveys'
import { RealTimeRedemptions } from '@/components/panelist/real-time-redemptions'

type DashboardTab = 'points' | 'activity' | 'surveys' | 'redemptions'

export function RealTimeDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('points')

  const tabs = [
    { id: 'points' as DashboardTab, label: 'Points', icon: '💰' },
    { id: 'activity' as DashboardTab, label: 'Activity', icon: '📊' },
    { id: 'surveys' as DashboardTab, label: 'Surveys', icon: '📝' },
    { id: 'redemptions' as DashboardTab, label: 'Redemptions', icon: '🎁' },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'points':
        return <RealTimePoints />
      case 'activity':
        return <RealTimeActivity />
      case 'surveys':
        return <RealTimeSurveys />
      case 'redemptions':
        return <RealTimeRedemptions />
      default:
        return <RealTimePoints />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Real-time Dashboard</h2>
        <div className="text-sm text-muted-foreground">
          Live updates from your account
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className="flex-1"
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <Card className="p-6">
        {renderTabContent()}
      </Card>

      {/* Connection Status */}
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Real-time Status</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-600 dark:text-green-400">Connected</span>
          </div>
        </div>
      </Card>
    </div>
  )
} 