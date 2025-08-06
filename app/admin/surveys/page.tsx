'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SurveyList } from "@/components/survey-admin/survey-list"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function AdminSurveysPage() {
  return (
    <div className="space-y-6 pt-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Survey Management</h1>
        <p className="text-muted-foreground mt-3">
          Create and manage surveys, view performance metrics.
        </p>
      </div>

      {/* Existing Surveys List */}
      <SurveyList />
    </div>
  )
} 