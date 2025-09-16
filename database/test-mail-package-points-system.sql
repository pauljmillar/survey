-- Test Mail Package Points System
-- This script tests the new points system to ensure it works correctly
-- 
-- Prerequisites: Run update-mail-package-points-system.sql first
-- 
-- This script will:
-- 1. Create a test panelist
-- 2. Insert a mail package (should award 5 points)
-- 3. Update status to 'completed' (should award 5 more points)
-- 4. Insert mail scans (should NOT award points)
-- 5. Verify the point ledger entries

-- Step 1: Create a test user and panelist (if they don't exist)
-- Note: You may need to adjust the user_id to match your Clerk setup
INSERT INTO users (id, email, role) 
VALUES ('test_user_mail_points', 'test.mail.points@example.com', 'panelist')
ON CONFLICT (id) DO NOTHING;

INSERT INTO panelist_profiles (user_id, points_balance, total_points_earned, total_points_redeemed)
VALUES ('test_user_mail_points', 0, 0, 0)
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Get the panelist_id for our test
DO $$
DECLARE
  test_panelist_id UUID;
  test_package_id UUID;
  initial_balance INTEGER;
  after_insert_balance INTEGER;
  after_complete_balance INTEGER;
  ledger_count INTEGER;
BEGIN
  -- Get the panelist_id
  SELECT id INTO test_panelist_id
  FROM panelist_profiles
  WHERE user_id = 'test_user_mail_points';
  
  RAISE NOTICE 'Testing with panelist_id: %', test_panelist_id;
  
  -- Get initial balance
  SELECT points_balance INTO initial_balance
  FROM panelist_profiles
  WHERE id = test_panelist_id;
  
  RAISE NOTICE 'Initial balance: %', initial_balance;
  
  -- Step 3: Insert a mail package (should award 5 points)
  INSERT INTO mail_packages (panelist_id, package_name, package_description, status)
  VALUES (test_panelist_id, 'Test Package', 'Test mail package for points system', 'pending')
  RETURNING id INTO test_package_id;
  
  RAISE NOTICE 'Created mail package with id: %', test_package_id;
  
  -- Check balance after insert
  SELECT points_balance INTO after_insert_balance
  FROM panelist_profiles
  WHERE id = test_panelist_id;
  
  RAISE NOTICE 'Balance after package insert: % (expected: %)', after_insert_balance, initial_balance + 5;
  
  -- Step 4: Update status to 'completed' (should award 5 more points)
  UPDATE mail_packages 
  SET 
    status = 'completed',
    reviewed_by = 'test_user_mail_points',
    review_date = NOW()
  WHERE id = test_package_id;
  
  -- Check balance after status update
  SELECT points_balance INTO after_complete_balance
  FROM panelist_profiles
  WHERE id = test_panelist_id;
  
  RAISE NOTICE 'Balance after status update to completed: % (expected: %)', after_complete_balance, initial_balance + 10;
  
  -- Step 5: Insert mail scans (should NOT award points)
  INSERT INTO mail_scans (
    panelist_id, 
    mailpack_id, 
    image_filename, 
    s3_key, 
    image_sequence, 
    industry, 
    mail_type, 
    brand_name
  ) VALUES 
  (test_panelist_id, test_package_id, 'test1.jpg', 'test/path/test1.jpg', 1, 'retail', 'postcard', 'Test Brand'),
  (test_panelist_id, test_package_id, 'test2.jpg', 'test/path/test2.jpg', 2, 'retail', 'postcard', 'Test Brand');
  
  -- Check balance after scan inserts (should be unchanged)
  SELECT points_balance INTO after_complete_balance
  FROM panelist_profiles
  WHERE id = test_panelist_id;
  
  RAISE NOTICE 'Balance after scan inserts: % (should be same as before)', after_complete_balance;
  
  -- Step 6: Verify point ledger entries
  SELECT COUNT(*) INTO ledger_count
  FROM point_ledger
  WHERE panelist_id = 'test_user_mail_points';
  
  RAISE NOTICE 'Total ledger entries for test user: % (expected: 2)', ledger_count;
  
  -- Show the ledger entries
  RAISE NOTICE 'Ledger entries:';
  FOR ledger_count IN 
    SELECT id, points, transaction_type, title, description, created_at
    FROM point_ledger
    WHERE panelist_id = 'test_user_mail_points'
    ORDER BY created_at
  LOOP
    RAISE NOTICE 'Entry: %', ledger_count;
  END LOOP;
  
  -- Clean up test data
  DELETE FROM mail_scans WHERE mailpack_id = test_package_id;
  DELETE FROM mail_packages WHERE id = test_package_id;
  DELETE FROM point_ledger WHERE panelist_id = 'test_user_mail_points';
  DELETE FROM panelist_profiles WHERE user_id = 'test_user_mail_points';
  DELETE FROM users WHERE id = 'test_user_mail_points';
  
  RAISE NOTICE 'Test completed and cleaned up';
  
END $$;

-- Step 7: Show summary of transaction types
SELECT 
  transaction_type,
  COUNT(*) as count,
  SUM(points) as total_points
FROM point_ledger
WHERE transaction_type IN ('mail_scan_points', 'mail_package_scan', 'mail_package_review')
GROUP BY transaction_type
ORDER BY transaction_type;
