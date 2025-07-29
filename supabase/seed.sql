-- Seed data for Panelist Rewards Platform
-- This file contains sample data for development and testing

-- Insert sample users (these would normally be created by Clerk)
INSERT INTO users (id, email, role) VALUES
  ('user_panelist_1', 'panelist1@example.com', 'panelist'),
  ('user_panelist_2', 'panelist2@example.com', 'panelist'),
  ('user_panelist_3', 'panelist3@example.com', 'panelist'),
  ('user_survey_admin_1', 'surveyadmin1@example.com', 'survey_admin'),
  ('user_survey_admin_2', 'surveyadmin2@example.com', 'survey_admin'),
  ('user_system_admin_1', 'systemadmin@example.com', 'system_admin');

-- Insert panelist profiles
INSERT INTO panelist_profiles (user_id, points_balance, total_points_earned, total_points_redeemed, profile_data, is_active) VALUES
  ('user_panelist_1', 250, 500, 250, '{"age": 28, "location": "New York", "interests": ["technology", "food"]}', true),
  ('user_panelist_2', 750, 1000, 250, '{"age": 35, "location": "California", "interests": ["travel", "health"]}', true),
  ('user_panelist_3', 100, 100, 0, '{"age": 22, "location": "Texas", "interests": ["sports", "music"]}', true);

-- Insert sample surveys
INSERT INTO surveys (title, description, points_reward, estimated_completion_time, qualification_criteria, status, created_by) VALUES
  ('Customer Satisfaction Survey', 'Help us understand your shopping experience', 50, 10, '{"min_age": 18, "locations": ["US", "CA"]}', 'active', 'user_survey_admin_1'),
  ('Technology Usage Study', 'Share your thoughts on mobile apps and websites', 75, 15, '{"min_age": 21, "interests": ["technology"]}', 'active', 'user_survey_admin_1'),
  ('Food Preferences Research', 'Tell us about your dining habits', 40, 8, '{"interests": ["food"]}', 'active', 'user_survey_admin_2'),
  ('Draft Survey Example', 'This survey is still being prepared', 60, 12, '{}', 'draft', 'user_survey_admin_2');

-- Get panelist profile IDs for further seed data
-- Insert survey qualifications (panelists qualified for specific surveys)
INSERT INTO survey_qualifications (survey_id, panelist_id, is_qualified)
SELECT s.id, p.id, true
FROM surveys s
CROSS JOIN panelist_profiles p
WHERE s.status = 'active'
  AND ((s.title = 'Customer Satisfaction Survey') -- All panelists qualified
       OR (s.title = 'Technology Usage Study' AND p.user_id IN ('user_panelist_1', 'user_panelist_2'))
       OR (s.title = 'Food Preferences Research' AND p.user_id IN ('user_panelist_1', 'user_panelist_3')));

-- Insert sample survey completions
INSERT INTO survey_completions (survey_id, panelist_id, points_earned, completed_at, response_data)
SELECT 
  s.id,
  p.id,
  s.points_reward,
  NOW() - INTERVAL '2 days',
  '{"satisfaction": 8, "likelihood_to_recommend": 9}'
FROM surveys s
JOIN panelist_profiles p ON p.user_id = 'user_panelist_1'
WHERE s.title = 'Customer Satisfaction Survey'
UNION ALL
SELECT 
  s.id,
  p.id,
  s.points_reward,
  NOW() - INTERVAL '5 days',
  '{"app_usage": "daily", "preferred_features": ["notifications", "search"]}'
FROM surveys s
JOIN panelist_profiles p ON p.user_id = 'user_panelist_2'
WHERE s.title = 'Technology Usage Study';

-- Insert sample merchant offers
INSERT INTO merchant_offers (title, description, points_required, merchant_name, offer_details, is_active) VALUES
  ('$10 Amazon Gift Card', 'Redeem your points for a $10 Amazon gift card', 200, 'Amazon', '{"denomination": 10, "type": "gift_card", "delivery": "email"}', true),
  ('$25 Starbucks Gift Card', 'Enjoy your favorite coffee with this gift card', 500, 'Starbucks', '{"denomination": 25, "type": "gift_card", "delivery": "email"}', true),
  ('$5 PayPal Cash', 'Get cash directly to your PayPal account', 100, 'PayPal', '{"denomination": 5, "type": "cash", "delivery": "paypal"}', true),
  ('Movie Theater Voucher', 'Free movie ticket for any standard showing', 300, 'AMC Theaters', '{"type": "voucher", "validity": "6 months"}', true),
  ('$50 Target Gift Card', 'Shop for anything at Target stores or online', 1000, 'Target', '{"denomination": 50, "type": "gift_card", "delivery": "email"}', false);

-- Insert sample redemptions
INSERT INTO redemptions (panelist_id, offer_id, points_spent, status, redemption_date)
SELECT 
  p.id,
  o.id,
  o.points_required,
  'completed',
  NOW() - INTERVAL '1 day'
FROM panelist_profiles p
JOIN merchant_offers o ON o.title = '$10 Amazon Gift Card'
WHERE p.user_id = 'user_panelist_1'
UNION ALL
SELECT 
  p.id,
  o.id,
  o.points_required,
  'completed',
  NOW() - INTERVAL '3 days'
FROM panelist_profiles p
JOIN merchant_offers o ON o.title = '$5 PayPal Cash'
WHERE p.user_id = 'user_panelist_2'
UNION ALL
SELECT 
  p.id,
  o.id,
  o.points_required,
  'pending',
  NOW()
FROM panelist_profiles p
JOIN merchant_offers o ON o.title = 'Movie Theater Voucher'
WHERE p.user_id = 'user_panelist_2';

-- Insert sample activity log entries
INSERT INTO activity_log (user_id, activity_type, description, metadata)
VALUES
  ('user_panelist_1', 'survey_completed', 'Completed Customer Satisfaction Survey', '{"survey_id": "uuid_here", "points_earned": 50}'),
  ('user_panelist_1', 'points_redeemed', 'Redeemed $10 Amazon Gift Card', '{"offer_id": "uuid_here", "points_spent": 200}'),
  ('user_panelist_2', 'survey_completed', 'Completed Technology Usage Study', '{"survey_id": "uuid_here", "points_earned": 75}'),
  ('user_panelist_2', 'points_redeemed', 'Redeemed $5 PayPal Cash', '{"offer_id": "uuid_here", "points_spent": 100}'),
  ('user_panelist_2', 'points_redeemed', 'Redeemed Movie Theater Voucher', '{"offer_id": "uuid_here", "points_spent": 300}'),
  ('user_panelist_3', 'registration', 'Account created and profile initialized', '{"initial_points": 0}'),
  ('user_survey_admin_1', 'survey_created', 'Created Customer Satisfaction Survey', '{"survey_id": "uuid_here"}'),
  ('user_survey_admin_1', 'survey_created', 'Created Technology Usage Study', '{"survey_id": "uuid_here"}');

-- Update activity log with actual UUIDs (this would be done programmatically in a real scenario)
-- For now, we'll leave placeholder values since we can't easily reference the generated UUIDs

-- Comments for seed data documentation
COMMENT ON TABLE users IS 'Sample users for testing - in production, these are managed by Clerk';
COMMENT ON TABLE panelist_profiles IS 'Sample panelist profiles with varying point balances';
COMMENT ON TABLE surveys IS 'Mix of active and draft surveys for testing';
COMMENT ON TABLE survey_qualifications IS 'Sample qualification mappings between surveys and panelists';
COMMENT ON TABLE survey_completions IS 'Historical completion data for testing';
COMMENT ON TABLE merchant_offers IS 'Sample redemption options including active and inactive offers';
COMMENT ON TABLE redemptions IS 'Sample redemption history with different statuses';
COMMENT ON TABLE activity_log IS 'Sample activity entries for testing the activity feed'; 