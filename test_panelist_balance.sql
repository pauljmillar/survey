-- Test get_panelist_balance() function for a specific user
-- Replace 'your_user_id_here' with the actual user ID you want to test

-- Option 1: Test with user_id (Clerk ID - TEXT)
SELECT 
  'Testing with user_id' as test_type,
  'your_user_id_here' as user_id,
  get_panelist_balance('your_user_id_here') as balance_from_function;

-- Option 2: Test with panelist_id (UUID from panelist_profiles.id)
-- First, get the panelist_id for a user
SELECT 
  'Panelist profile lookup' as test_type,
  u.id as user_id,
  pp.id as panelist_id,
  pp.points_balance as cached_balance,
  get_panelist_balance(u.id) as balance_from_function
FROM users u
LEFT JOIN panelist_profiles pp ON u.id = pp.user_id
WHERE u.id = 'your_user_id_here';

-- Option 3: Test for all panelists (to find a user with data)
SELECT 
  'All panelists with balances' as test_type,
  u.id as user_id,
  pp.id as panelist_id,
  pp.points_balance as cached_balance,
  get_panelist_balance(u.id) as balance_from_function,
  CASE 
    WHEN pp.points_balance = get_panelist_balance(u.id) THEN 'MATCH'
    ELSE 'MISMATCH'
  END as balance_status
FROM users u
LEFT JOIN panelist_profiles pp ON u.id = pp.user_id
WHERE u.role = 'panelist'
ORDER BY pp.points_balance DESC
LIMIT 10;

-- Option 4: Debug the ledger entries for a specific user
SELECT 
  'Ledger entries for user' as test_type,
  pl.panelist_id,
  pl.points,
  pl.balance_after,
  pl.transaction_type,
  pl.title,
  pl.created_at,
  ROW_NUMBER() OVER (ORDER BY pl.created_at DESC, pl.id DESC) as entry_order
FROM point_ledger pl
WHERE pl.panelist_id = 'your_user_id_here'
ORDER BY pl.created_at DESC, pl.id DESC
LIMIT 10;

-- Option 5: Compare cached balance vs ledger balance for all users
SELECT 
  'Balance comparison' as test_type,
  u.id as user_id,
  u.email,
  pp.points_balance as cached_balance,
  get_panelist_balance(u.id) as ledger_balance,
  CASE 
    WHEN pp.points_balance = get_panelist_balance(u.id) THEN '✓ MATCH'
    WHEN pp.points_balance IS NULL AND get_panelist_balance(u.id) = 0 THEN '✓ BOTH ZERO'
    ELSE '✗ MISMATCH'
  END as status,
  (pp.points_balance - get_panelist_balance(u.id)) as difference
FROM users u
LEFT JOIN panelist_profiles pp ON u.id = pp.user_id
WHERE u.role = 'panelist'
ORDER BY ABS(COALESCE(pp.points_balance, 0) - get_panelist_balance(u.id)) DESC;

-- Option 6: Find users with negative ledger balances
SELECT 
  'Users with negative ledger balances' as test_type,
  u.id as user_id,
  u.email,
  pp.points_balance as cached_balance,
  get_panelist_balance(u.id) as ledger_balance,
  (SELECT COUNT(*) FROM point_ledger WHERE panelist_id = u.id) as ledger_entries_count
FROM users u
LEFT JOIN panelist_profiles pp ON u.id = pp.user_id
WHERE u.role = 'panelist'
  AND get_panelist_balance(u.id) < 0
ORDER BY get_panelist_balance(u.id) ASC;

-- Option 7: Test with a specific panelist_id (UUID)
-- First find a panelist_id, then test
WITH sample_panelist AS (
  SELECT pp.id as panelist_id, u.id as user_id
  FROM panelist_profiles pp
  JOIN users u ON pp.user_id = u.id
  WHERE u.role = 'panelist'
  LIMIT 1
)
SELECT 
  'Testing with panelist_id' as test_type,
  sp.panelist_id,
  sp.user_id,
  get_panelist_balance(sp.user_id) as balance_from_function
FROM sample_panelist sp;
