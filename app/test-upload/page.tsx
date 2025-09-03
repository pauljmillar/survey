'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react'

export default function TestUploadPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testData = {
    mail_package_id: null,
    document_type: "scan" as const,
    file_data: "SGVsbG8gV29ybGQ=", // Base64 encoded "Hello World"
    filename: `test_scan_${Date.now()}.jpg`,
    image_sequence: 1,
    mime_type: "image/jpeg",
    metadata: { 
      test: true,
      timestamp: new Date().toISOString()
    }
  }

  const testUpload = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🚀 Testing upload API with data:', testData)
      
      const response = await fetch('/api/panelist/mail-scans/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
        console.log('✅ Upload successful:', data)
      } else {
        setError(data.error || `HTTP ${response.status}: ${response.statusText}`)
        console.error('❌ Upload failed:', data)
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('💥 Request failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const testExistingPackage = async () => {
    if (!result?.mail_package?.id) {
      setError('No mail package ID available. Run the first test first.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const testDataWithPackage = {
        ...testData,
        mail_package_id: result.mail_package.id,
        document_type: "supporting_document" as const,
        filename: `test_document_${Date.now()}.pdf`,
        mime_type: "application/pdf"
      }

      console.log('📦 Testing with existing package:', testDataWithPackage)
      
      const response = await fetch('/api/panelist/mail-scans/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testDataWithPackage)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult({ ...result, secondUpload: data })
        console.log('✅ Second upload successful:', data)
      } else {
        setError(data.error || `HTTP ${response.status}: ${response.statusText}`)
        console.error('❌ Second upload failed:', data)
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('💥 Second request failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload API Test Page</h1>
        <p className="text-muted-foreground mt-2">
          Test the mail scanning upload API functionality
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Test Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button 
                onClick={testUpload} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Testing...' : 'Test New Package Upload'}
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                Creates a new mail package and uploads a scan
              </p>
            </div>

            <div>
              <Button 
                onClick={testExistingPackage} 
                disabled={isLoading || !result?.mail_package?.id}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Testing...' : 'Test Existing Package Upload'}
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                Uses existing mail package to upload a document
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Test Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Test Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="test-data">Request Payload</Label>
            <Textarea
              id="test-data"
              value={JSON.stringify(testData, null, 2)}
              readOnly
              className="mt-2 font-mono text-xs"
              rows={8}
            />
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">First Upload (New Package)</h4>
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>

              {result.secondUpload && (
                <div>
                  <h4 className="font-semibold mb-2">Second Upload (Existing Package)</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(result.secondUpload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status Info */}
      <Card>
        <CardHeader>
          <CardTitle>Test Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Test 1:</strong> Creates a new mail package with <code>mail_package_id: null</code></p>
          <p><strong>Test 2:</strong> Uses the created package ID to upload additional documents</p>
          <p><strong>File Data:</strong> Uses a simple base64 encoded "Hello World" string</p>
          <p><strong>Authentication:</strong> Requires you to be logged in to the application</p>
        </CardContent>
      </Card>
    </div>
  )
}
