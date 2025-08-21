# Mobile App Profile Creation - Two-Phase Approach

## Problem Statement

When users sign up via the mobile app, they skip the web registration questions (demographics, etc.), so no `panelist_profile` record is created. This results in:

- No dashboard access (404 error)
- No signup bonus awarded
- No point tracking
- Inconsistent user experience between web and mobile

## Current Registration Flow

1. User signs up with Clerk
2. User completes registration questions (demographics, etc.)
3. `panelist_profile` record is created with the questionnaire data
4. Signup bonus is awarded (triggered by `panelist_profile` creation)

## Proposed Solution: Two-Phase Profile Creation

### Phase 1: Immediate Profile Creation (User Signup)
- Create a minimal `panelist_profile` record immediately after user creation
- Include only essential fields: `user_id`, `points_balance: 0`, `total_points_earned: 0`, `total_points_redeemed: 0`, `total_scans: 0`, `surveys_completed: 0`
- Award signup bonus at this point
- Enable dashboard access

### Phase 2: Profile Completion (Optional)
- When user completes registration questions, update the existing profile with demographic data
- This can happen via web registration OR mobile app onboarding flow
- No duplicate profile creation

## Implementation Steps

### Step 1: Create Minimal Profile on User Creation
Create a trigger that creates a basic `panelist_profile` record immediately when a user is created:

```sql
-- Create function to create minimal panelist profile
CREATE OR REPLACE FUNCTION create_minimal_panelist_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile for panelist users
  IF NEW.role = 'panelist' THEN
    INSERT INTO panelist_profiles (
      user_id,
      points_balance,
      total_points_earned,
      total_points_redeemed,
      total_scans,
      surveys_completed,
      profile_data,
      is_active
    ) VALUES (
      NEW.id,
      0,
      0,
      0,
      0,
      0,
      '{}',
      true
    );
    
    RAISE NOTICE 'Minimal panelist profile created for user: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on users table
DROP TRIGGER IF EXISTS trigger_create_minimal_profile ON users;
CREATE TRIGGER trigger_create_minimal_profile
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_minimal_panelist_profile();
```

### Step 2: Update Registration Flow to Update Existing Profile
Modify the registration API to update existing profile instead of creating new one:

```sql
-- Update the panelist profile creation API logic
-- Instead of INSERT, use INSERT ... ON CONFLICT ... DO UPDATE
INSERT INTO panelist_profiles (
  user_id,
  points_balance,
  total_points_earned,
  total_points_redeemed,
  total_scans,
  surveys_completed,
  profile_data,
  is_active
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8
) ON CONFLICT (user_id) DO UPDATE SET
  profile_data = EXCLUDED.profile_data,
  updated_at = NOW();
```

### Step 3: Update API Endpoints
Modify the panelist profile API endpoints:

**POST endpoint** (registration):
- Check if profile exists
- If exists: update with new data
- If not exists: create new profile (fallback)

**GET endpoint**:
- Return existing profile or 404 (no change needed)

### Step 4: Add Mobile App Profile Completion
Create an optional endpoint for mobile users to complete their profile:

```sql
-- Optional: Add a "profile_completion_status" field to track if demographics were provided
ALTER TABLE panelist_profiles 
ADD COLUMN IF NOT EXISTS profile_completion_status TEXT DEFAULT 'minimal' 
CHECK (profile_completion_status IN ('minimal', 'complete'));

-- Update the registration flow to set status to 'complete'
-- Update mobile completion endpoint to set status to 'complete'
```

### Step 5: Update Frontend Registration Flow
Modify the web registration process:
- Check if profile already exists
- If exists: update profile data
- If not exists: create new profile (fallback)

### Step 6: Add Mobile App Profile Completion UI
Create a simple form in the mobile app for users who want to provide demographic data:
- Optional "Complete Profile" section
- Basic demographic questions
- Updates existing profile record

## Benefits

1. **Mobile app users get immediate dashboard access** with minimal profile
2. **Signup bonus still works** (triggered by profile creation)
3. **Web registration flow unchanged** - still creates/updates profile
4. **Backward compatible** - existing users unaffected
5. **Flexible** - demographic data optional and can be added later

## Testing Scenarios

1. **New web user**: Creates profile during registration
2. **New mobile user**: Gets minimal profile, can complete later
3. **Existing user**: Profile already exists, registration updates it
4. **Mobile user completing profile**: Updates existing minimal profile

## Files to Modify

### Database
- Create new trigger function and trigger
- Optional: Add `profile_completion_status` column

### API Routes
- `app/api/auth/panelist-profile/route.ts` - Update POST logic
- New endpoint: `app/api/auth/panelist-profile/complete/route.ts` (optional)

### Frontend
- Registration flow to handle existing profiles
- Mobile app profile completion UI (optional)

## Notes

- This is currently an edge case and not implemented
- The signup bonus trigger remains on `panelist_profiles` creation (not moved to `users` creation)
- Minimal changes to existing functionality
- Maintains backward compatibility

## Future Considerations

- Add profile completion incentives (bonus points for completing demographics)
- Analytics tracking for profile completion rates
- A/B testing different onboarding flows
- Integration with survey qualification system 