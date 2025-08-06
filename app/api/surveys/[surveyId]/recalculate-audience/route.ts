import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { requireAuth } from '@/lib/auth'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Function to check if a panelist meets qualification criteria
function isPanelistEligible(profileData: any, criteria: any): boolean {
  if (!criteria || Object.keys(criteria).length === 0) {
    return true // No criteria means everyone is eligible
  }

  // Check gender criteria
  if (criteria.gender && profileData.gender) {
    if (!criteria.gender.includes(profileData.gender)) {
      return false
    }
  }

  // Check age range
  if (criteria.age_range && profileData.age) {
    const [minAge, maxAge] = criteria.age_range
    if (profileData.age < minAge || profileData.age > maxAge) {
      return false
    }
  }

  // Check location criteria
  if (criteria.location) {
    if (criteria.location.countries && profileData.location?.country) {
      if (!criteria.location.countries.includes(profileData.location.country)) {
        return false
      }
    }
    if (criteria.location.states && profileData.location?.state) {
      if (!criteria.location.states.includes(profileData.location.state)) {
        return false
      }
    }
  }

  // Check interests (at least one must match)
  if (criteria.interests && profileData.interests) {
    const hasMatchingInterest = criteria.interests.some((interest: string) =>
      profileData.interests.includes(interest)
    )
    if (!hasMatchingInterest) {
      return false
    }
  }

  // Check demographics
  if (criteria.demographics) {
    if (criteria.demographics.income_range && profileData.demographics?.income_range) {
      if (!criteria.demographics.income_range.includes(profileData.demographics.income_range)) {
        return false
      }
    }
    if (criteria.demographics.education && profileData.demographics?.education) {
      if (!criteria.demographics.education.includes(profileData.demographics.education)) {
        return false
      }
    }
    if (criteria.demographics.employment && profileData.demographics?.employment) {
      if (!criteria.demographics.employment.includes(profileData.demographics.employment)) {
        return false
      }
    }
  }

  return true
}

export async function POST(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const user = await requireAuth('create_surveys')
    const { surveyId } = params

    // Get the survey and its qualification criteria
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('qualification_criteria')
      .eq('id', surveyId)
      .single()

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    // Get all panelists with their profile data
    const { data: panelists, error: panelistsError } = await supabase
      .from('panelist_profiles')
      .select('id, profile_data')
      .eq('is_active', true)

    if (panelistsError) {
      console.error('Error fetching panelists:', panelistsError)
      return NextResponse.json({ error: 'Failed to fetch panelists' }, { status: 500 })
    }

    // Clear existing qualifications for this survey
    const { error: deleteError } = await supabase
      .from('survey_qualifications')
      .delete()
      .eq('survey_id', surveyId)

    if (deleteError) {
      console.error('Error clearing existing qualifications:', deleteError)
      return NextResponse.json({ error: 'Failed to clear existing qualifications' }, { status: 500 })
    }

    // Calculate qualifications for each panelist
    const qualifications = panelists.map(panelist => ({
      survey_id: surveyId,
      panelist_id: panelist.id,
      is_qualified: isPanelistEligible(panelist.profile_data, survey.qualification_criteria)
    }))

    // Insert all qualifications
    const { error: insertError } = await supabase
      .from('survey_qualifications')
      .insert(qualifications)

    if (insertError) {
      console.error('Error inserting qualifications:', insertError)
      return NextResponse.json({ error: 'Failed to insert qualifications' }, { status: 500 })
    }

    // Count eligible panelists
    const eligibleCount = qualifications.filter(q => q.is_qualified).length

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_activity_type: 'audience_recalculated',
      p_description: `Recalculated audience for survey ${surveyId}: ${eligibleCount} eligible panelists`,
      p_metadata: { survey_id: surveyId, eligible_count: eligibleCount }
    })

    return NextResponse.json({
      success: true,
      eligible_count: eligibleCount,
      total_panelists: panelists.length
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error in recalculate-audience API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 