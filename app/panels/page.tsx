import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PanelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panels</h1>
        <p className="text-muted-foreground">
          Join specialized panels for targeted surveys and higher rewards.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Panel functionality will be available in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This feature will allow you to join specialized panels for targeted surveys with higher point rewards.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 