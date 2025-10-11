import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Camera and Image Collection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-foreground font-medium mr-2">•</span>
                We use your device's camera to scan mail documents
              </li>
              <li className="flex items-start">
                <span className="text-foreground font-medium mr-2">•</span>
                Some image processing occurs locally, and then they are uploaded to secure cloud storage
              </li>
              <li className="flex items-start">
                <span className="text-foreground font-medium mr-2">•</span>
                Images are analyzed using AI to identify mail content and categorize marketing offers and promotions
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Data Storage and Processing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-foreground font-medium mr-2">•</span>
                Scanned images are stored securely in encrypted cloud storage
              </li>
              <li className="flex items-start">
                <span className="text-foreground font-medium mr-2">•</span>
                Mail analysis data is stored securely in a cloud database
              </li>
              <li className="flex items-start">
                <span className="text-foreground font-medium mr-2">•</span>
                We use OpenAI's API to analyze mail content for research purposes
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">User Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-foreground font-medium mr-2">•</span>
                You can request deletion of your data at any time
              </li>
              <li className="flex items-start">
                <span className="text-foreground font-medium mr-2">•</span>
                You can opt out of data collection
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy or would like to exercise your rights, 
              please contact us through our support channels.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
