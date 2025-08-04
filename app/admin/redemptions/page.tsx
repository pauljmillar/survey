import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminRedemptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Redemption Management</h1>
        <p className="text-muted-foreground">
          Manage redemption requests and track reward distributions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Redemption management functionality will be available in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This feature will allow administrators to manage redemption requests, approve rewards, and track distribution metrics.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 