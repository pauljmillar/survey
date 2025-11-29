# Contest System Testing Guide

This guide will help you test the contest system implementation after the database migration has been completed.

## Prerequisites

- Database migration has been run successfully
- TypeScript types have been updated
- Development server is running (`npm run dev`)
- You have admin and panelist test accounts

## Step 1: Test Admin Contest Creation

### 1.1 Create a Contest

1. Navigate to `/admin/contests` as an admin user
2. Click "Create Contest"
3. Fill in the form:
   - **Title**: "Summer Points Challenge"
   - **Description**: "Earn the most points this summer!"
   - **Start Date**: Set to a future date/time
   - **End Date**: Set to a date after start date
   - **Prize Points**: 500
   - **Invite Type**: Select "All Panelists"
4. Click "Create Contest"
5. **Expected**: Contest appears in the list with status "draft"

### 1.2 Create an Invite-Only Contest

1. Create another contest
2. Select "Select Panelists" as invite type
3. Select 2-3 panelists from the list
4. Create the contest
5. **Expected**: Contest created with selected panelists invited

## Step 2: Test Contest Management

### 2.1 Start a Contest

1. Open a draft contest
2. Click "Start Contest"
3. **Expected**: 
   - Status changes to "active"
   - Contest becomes visible to panelists (if invite_type = 'all_panelists')

### 2.2 Edit a Draft Contest

1. Open a draft contest
2. Click "Edit"
3. Change the title or prize points
4. Save
5. **Expected**: Changes are saved

### 2.3 View Contest Details

1. Open any contest
2. **Expected**: 
   - Contest information displayed
   - Participant count shown
   - Leaderboard section visible (empty if no participants)

## Step 3: Test Panelist Functionality

### 3.1 View Available Contests

1. Log in as a panelist
2. Navigate to `/contests`
3. **Expected**:
   - Active contests visible (if invite_type = 'all_panelists' or user is invited)
   - "Active" tab shows active contests
   - "Ended" tab shows ended contests
   - "My Contests" tab shows joined contests

### 3.2 Join a Contest

1. Open an active contest
2. Click "Join Contest"
3. **Expected**:
   - Success message
   - "Join Contest" button disappears
   - Your participation status appears
   - You appear in the leaderboard (with 0 points initially)

### 3.3 View Contest Details

1. Open a contest you've joined
2. **Expected**:
   - Your rank and points displayed
   - Leaderboard showing top participants
   - Contest dates and prize information

### 3.4 View Full Leaderboard

1. Open a contest
2. Click "View Full Leaderboard" (or navigate to `/contests/[contestId]/leaderboard`)
3. **Expected**:
   - Complete ranked leaderboard
   - Your position highlighted
   - All participants with their ranks and points

## Step 4: Test Points Calculation

### 4.1 Earn Points During Contest

1. Join an active contest as a panelist
2. Complete a survey or perform an action that awards points
3. Wait a moment, then refresh the contest page
4. **Expected**:
   - Points earned during contest period are reflected
   - Your rank updates if applicable

### 4.2 Update Leaderboard

1. As admin, open a contest with participants
2. Click "Update Leaderboard"
3. **Expected**:
   - Leaderboard recalculates
   - Ranks update based on points_earned
   - Participants with same points get same rank

## Step 5: Test Contest Ending and Prize Awarding

### 5.1 End a Contest

1. As admin, open an active contest
2. Click "End Contest"
3. **Expected**:
   - Status changes to "ended"
   - Final leaderboard is calculated
   - Contest no longer appears in active list for panelists

### 5.2 Award Prizes

1. As admin, open an ended contest
2. Find a participant in the leaderboard
3. Click "Award Prize" for that participant
4. **Expected**:
   - Prize points are awarded to the participant
   - Prize status changes to "Awarded"
   - Point ledger entry created with transaction_type 'contest_prize'
   - Participant's balance increases

### 5.3 View Ended Contest (Panelist)

1. As panelist, navigate to `/contests`
2. Switch to "Ended" tab
3. Open an ended contest you participated in
4. **Expected**:
   - "Contest Ended" indicator visible
   - Final leaderboard displayed
   - Your final rank and points shown

## Step 6: Test API Endpoints

### 6.1 Admin API Tests

```bash
# Get your Clerk session token first, then:

# List contests
curl -X GET "http://localhost:3000/api/admin/contests" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create contest
curl -X POST "http://localhost:3000/api/admin/contests" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Contest",
    "description": "Testing via API",
    "start_date": "2025-02-01T00:00:00Z",
    "end_date": "2025-02-28T23:59:59Z",
    "prize_points": 100,
    "invite_type": "all_panelists"
  }'

# Get contest details (replace CONTEST_ID)
curl -X GET "http://localhost:3000/api/admin/contests/CONTEST_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Start contest
curl -X POST "http://localhost:3000/api/admin/contests/CONTEST_ID/start" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update leaderboard
curl -X POST "http://localhost:3000/api/admin/contests/CONTEST_ID/update-leaderboard" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6.2 Panelist API Tests

```bash
# List available contests
curl -X GET "http://localhost:3000/api/contests?status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get contest details
curl -X GET "http://localhost:3000/api/contests/CONTEST_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Join contest
curl -X POST "http://localhost:3000/api/contests/CONTEST_ID/join" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get leaderboard
curl -X GET "http://localhost:3000/api/contests/CONTEST_ID/leaderboard" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 7: Test Edge Cases

### 7.1 Invite-Only Contest Access

1. Create a contest with "Select Panelists" invite type
2. Invite only specific panelists
3. Log in as a non-invited panelist
4. Navigate to `/contests`
5. **Expected**: Contest is NOT visible to non-invited panelist

### 7.2 Duplicate Join Attempt

1. Join a contest
2. Try to join again
3. **Expected**: Error message "Already joined this contest"

### 7.3 Join Ended Contest

1. Try to join a contest that has ended
2. **Expected**: Error message "Only active contests can be joined"

### 7.4 Points Calculation Accuracy

1. Join an active contest
2. Note your current points balance
3. Complete a survey (earns points)
4. Wait a few seconds
5. Check contest leaderboard
6. **Expected**: 
   - Points earned during contest period are counted
   - Points earned before contest started are NOT counted
   - Points earned after contest ended are NOT counted

### 7.5 Leaderboard Ties

1. Create a contest with multiple participants
2. Award same points to multiple participants
3. Update leaderboard
4. **Expected**: Participants with same points get same rank

## Step 8: Test Database Functions

Run these SQL queries in Supabase SQL Editor to verify functions work:

```sql
-- Test calculate_contest_points
-- Replace CONTEST_ID and PANELIST_ID with actual values
SELECT calculate_contest_points('CONTEST_ID'::uuid, 'PANELIST_ID'::uuid);

-- Test update_contest_leaderboard
-- Replace CONTEST_ID with actual value
SELECT update_contest_leaderboard('CONTEST_ID'::uuid);

-- Verify leaderboard was updated
SELECT * FROM contest_participants 
WHERE contest_id = 'CONTEST_ID'::uuid 
ORDER BY rank;
```

## Step 9: Verify RLS Policies

### 9.1 Panelist Access

1. Log in as a panelist
2. Try to access `/admin/contests`
3. **Expected**: Access denied or redirected

### 9.2 Admin Access

1. Log in as admin
2. Access `/admin/contests`
3. **Expected**: Full access to all contests

### 9.3 Contest Visibility

1. Create a contest with invite_type = 'selected_panelists'
2. Invite only panelist A
3. Log in as panelist B (not invited)
4. Try to access the contest directly via URL
5. **Expected**: Access denied (403 error)

## Step 10: Performance Testing

### 10.1 Large Leaderboard

1. Create a contest
2. Have 50+ panelists join
3. Update leaderboard
4. **Expected**: Leaderboard loads quickly (< 2 seconds)

### 10.2 Real-time Updates

1. Join an active contest
2. Keep the contest page open
3. Complete actions that earn points
4. **Expected**: Leaderboard auto-refreshes every 30 seconds

## Common Issues and Solutions

### Issue: Contest not visible to panelists
**Solution**: Check that contest status is 'active' and invite_type is 'all_panelists' or panelist is invited

### Issue: Points not calculating
**Solution**: 
- Verify points were earned during contest period (between start_date and end_date)
- Check point_ledger has entries with positive points
- Manually trigger leaderboard update

### Issue: Rank not updating
**Solution**: 
- Click "Update Leaderboard" button
- Verify calculate_contest_points function works
- Check that contest_participants records exist

### Issue: Cannot award prize
**Solution**: 
- Contest must be 'ended'
- Participant must not already have prize_awarded = true
- Verify contest has prize_points set

## Success Criteria

All tests should pass:
- ✅ Can create contests as admin
- ✅ Can start/end contests
- ✅ Panelists can view and join contests
- ✅ Points are calculated correctly
- ✅ Leaderboard ranks participants correctly
- ✅ Prizes can be awarded
- ✅ RLS policies work correctly
- ✅ API endpoints return correct data
- ✅ Real-time updates work for active contests

## Next Steps After Testing

1. Fix any issues found during testing
2. Test with production-like data volumes
3. Verify mobile app integration (if applicable)
4. Deploy to production
5. Monitor for errors in production

