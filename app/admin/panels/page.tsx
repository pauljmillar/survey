import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminPanelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel Management</h1>
        <p className="text-muted-foreground">
          Create and manage specialized survey panels.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Panel management functionality will be available in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This feature will allow administrators to create and manage specialized survey panels, assign panelists, and track panel performance.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 