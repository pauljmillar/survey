import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminSurveysPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Survey Management</h1>
        <p className="text-muted-foreground">
          Create and manage surveys, view performance metrics.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Survey management functionality will be available in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This feature will allow administrators to create, edit, and manage surveys, view performance metrics, and analyze completion rates.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 