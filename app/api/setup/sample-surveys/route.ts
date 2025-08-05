import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const sampleSurveys = [
  {
    title: "Product Feedback Survey",
    description: "Share your thoughts on our latest product features and help us improve the user experience. This survey will take about 5 minutes to complete.",
    points_reward: 50,
    estimated_completion_time: 5,
    qualification_criteria: { age_group: "18-65", location: "US" },
    status: "active"
  },
  {
    title: "Customer Satisfaction Survey",
    description: "We value your feedback! Please take a moment to rate your recent experience with our service. Your input helps us maintain high quality standards.",
    points_reward: 75,
    estimated_completion_time: 8,
    qualification_criteria: { has_purchased: true, customer_type: "returning" },
    status: "active"
  },
  {
    title: "Market Research Study",
    description: "Participate in our market research study to help us understand consumer preferences and trends. This comprehensive survey covers various topics.",
    points_reward: 100,
    estimated_completion_time: 12,
    qualification_criteria: { demographics: "general", interests: "shopping" },
    status: "active"
  },
  {
    title: "Quick Opinion Poll",
    description: "A brief 2-minute survey about current events and social trends. Your quick opinion matters to us!",
    points_reward: 25,
    estimated_completion_time: 2,
    qualification_criteria: {},
    status: "active"
  },
  {
    title: "Technology Usage Survey",
    description: "Help us understand how people use technology in their daily lives. This survey explores device usage, app preferences, and digital habits.",
    points_reward: 60,
    estimated_completion_time: 7,
    qualification_criteria: { tech_savvy: true, device_owner: true },
    status: "active"
  },
  {
    title: "Shopping Behavior Study",
    description: "Share your shopping preferences and behaviors. This survey helps retailers understand consumer decision-making processes.",
    points_reward: 80,
    estimated_completion_time: 10,
    qualification_criteria: { shopping_frequency: "monthly", online_shopper: true },
    status: "active"
  },
  {
    title: "Health and Wellness Survey",
    description: "Participate in our health and wellness research. This survey covers topics like fitness habits, nutrition, and mental well-being.",
    points_reward: 90,
    estimated_completion_time: 15,
    qualification_criteria: { age_group: "18-55", health_conscious: true },
    status: "active"
  },
  {
    title: "Entertainment Preferences",
    description: "Tell us about your entertainment choices! This survey covers movies, TV shows, music, and gaming preferences.",
    points_reward: 40,
    estimated_completion_time: 6,
    qualification_criteria: { entertainment_consumer: true },
    status: "active"
  }
]

export async function POST(request: NextRequest) {
  try {
    // Get a user ID to use as created_by
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (userError || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'No users found in database. Please sign up first.' },
        { status: 400 }
      )
    }
    
    const userId = users[0].id
    const results = []
    let createdCount = 0
    
    // Create surveys
    for (const survey of sampleSurveys) {
      const { data, error } = await supabase
        .from('surveys')
        .insert({
          ...survey,
          created_by: userId
        })
        .select()
      
      if (error) {
        results.push({
          title: survey.title,
          success: false,
          error: error.message
        })
      } else {
        results.push({
          title: survey.title,
          success: true,
          points: survey.points_reward
        })
        createdCount++
      }
    }
    
    return NextResponse.json({
      message: `Successfully created ${createdCount} out of ${sampleSurveys.length} sample surveys`,
      created: createdCount,
      total: sampleSurveys.length,
      results
    })
    
  } catch (error) {
    console.error('Error creating sample surveys:', error)
    return NextResponse.json(
      { error: 'Failed to create sample surveys' },
      { status: 500 }
    )
  }
} 