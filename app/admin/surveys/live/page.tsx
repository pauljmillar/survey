import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminLiveSurveysPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Survey Management</h1>
        <p className="text-muted-foreground">
          Manage real-time surveys and monitor live participation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Live survey management functionality will be available in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This feature will allow administrators to create and manage real-time surveys, monitor live participation, and control survey flow.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 