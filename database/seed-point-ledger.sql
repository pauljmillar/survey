-- Seed Point Ledger with Sample Data
-- This script adds sample point ledger entries for testing

-- First, let's get some panelist IDs to work with
-- We'll use the first few panelists from the users table

-- Sample point ledger entries
INSERT INTO point_ledger (
  panelist_id,
  points,
  balance_after,
  transaction_type,
  title,
  description,
  metadata,
  awarded_by,
  created_at,
  effective_date
) VALUES 
-- Sample entries for testing (replace panelist_id with actual user IDs from your database)
-- You'll need to replace these UUIDs with actual panelist IDs from your users table

-- Entry 1: Welcome bonus
('user_2abc123def456', 500, 500, 'bonus', 'Welcome Bonus', 'Welcome to our panel program!', '{"reason": "new_user_welcome"}', NULL, NOW() - INTERVAL '30 days', CURRENT_DATE - INTERVAL '30 days'),

-- Entry 2: Survey completion
('user_2abc123def456', 250, 750, 'survey_completion', 'Survey Completion - Product Feedback', 'Completed product feedback survey', '{"survey_id": "survey_001", "duration_minutes": 15}', NULL, NOW() - INTERVAL '25 days', CURRENT_DATE - INTERVAL '25 days'),

-- Entry 3: Manual award
('user_2abc123def456', 100, 850, 'manual_award', 'Bonus for completing more than 4 surveys in a week', 'Exceptional participation bonus', '{"admin_note": "Great engagement this week"}', 'admin_user_id', NOW() - INTERVAL '20 days', CURRENT_DATE - INTERVAL '20 days'),

-- Entry 4: Redemption
('user_2abc123def456', -300, 550, 'redemption', 'Gift Card Redemption', 'Redeemed for $10 Amazon gift card', '{"offer_id": "offer_001", "redemption_value": 10}', NULL, NOW() - INTERVAL '15 days', CURRENT_DATE - INTERVAL '15 days'),

-- Entry 5: Weekly bonus
('user_2abc123def456', 150, 700, 'weekly_bonus', 'Weekly Activity Bonus', 'Completed 3 surveys this week', '{"surveys_completed": 3, "week_start": "2024-01-01"}', NULL, NOW() - INTERVAL '10 days', CURRENT_DATE - INTERVAL '10 days'),

-- Entry 6: Another panelist - Welcome bonus
('user_3def456ghi789', 500, 500, 'bonus', 'Welcome Bonus', 'Welcome to our panel program!', '{"reason": "new_user_welcome"}', NULL, NOW() - INTERVAL '28 days', CURRENT_DATE - INTERVAL '28 days'),

-- Entry 7: Survey completion for second panelist
('user_3def456ghi789', 300, 800, 'survey_completion', 'Survey Completion - Market Research', 'Completed market research survey', '{"survey_id": "survey_002", "duration_minutes": 20}', NULL, NOW() - INTERVAL '20 days', CURRENT_DATE - INTERVAL '20 days'),

-- Entry 8: Referral bonus
('user_3def456ghi789', 200, 1000, 'referral_bonus', 'Referral Bonus', 'Successfully referred a friend', '{"referred_user_id": "user_4ghi789jkl012"}', NULL, NOW() - INTERVAL '12 days', CURRENT_DATE - INTERVAL '12 days'),

-- Entry 9: System adjustment
('user_3def456ghi789', 50, 1050, 'system_adjustment', 'System Adjustment - Survey Compensation', 'Additional compensation for survey technical issues', '{"adjustment_reason": "technical_issue_compensation"}', NULL, NOW() - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days'),

-- Entry 10: Recent activity
('user_2abc123def456', 75, 775, 'survey_completion', 'Survey Completion - Customer Satisfaction', 'Completed customer satisfaction survey', '{"survey_id": "survey_003", "duration_minutes": 8}', NULL, NOW() - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days');

-- Note: You'll need to replace the panelist_id values with actual user IDs from your users table
-- You can find these by running: SELECT id FROM users WHERE role = 'panelist' LIMIT 5; 