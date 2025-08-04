import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminOffersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Offer Management</h1>
        <p className="text-muted-foreground">
          Create and manage merchant offers and rewards.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Offer management functionality will be available in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This feature will allow administrators to create, edit, and manage merchant offers, set reward values, and track redemption rates.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 