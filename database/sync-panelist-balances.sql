-- Sync existing panelist_profiles.points_balance with ledger data
-- This script should be run after the point ledger system is in place

-- Update panelist_profiles.points_balance to match their current ledger balance
UPDATE panelist_profiles 
SET 
  points_balance = COALESCE(
    (SELECT balance_after 
     FROM point_ledger 
     WHERE panelist_id = panelist_profiles.user_id 
     ORDER BY created_at DESC, id DESC 
     LIMIT 1), 
    0
  ),
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = panelist_profiles.user_id 
  AND users.role = 'panelist'
);

-- For panelists who don't have any ledger entries yet, ensure they have 0 balance
UPDATE panelist_profiles 
SET 
  points_balance = 0,
  updated_at = NOW()
WHERE user_id IN (
  SELECT u.id 
  FROM users u 
  WHERE u.role = 'panelist'
) 
AND NOT EXISTS (
  SELECT 1 FROM point_ledger 
  WHERE panelist_id = panelist_profiles.user_id
);

-- Verify the sync worked by showing a comparison
SELECT 
  pp.user_id,
  pp.points_balance as profile_balance,
  COALESCE(ledger_balance.balance_after, 0) as ledger_balance,
  CASE 
    WHEN pp.points_balance = COALESCE(ledger_balance.balance_after, 0) THEN '✅ SYNCED'
    ELSE '❌ MISMATCH'
  END as status
FROM panelist_profiles pp
LEFT JOIN (
  SELECT 
    panelist_id,
    balance_after
  FROM point_ledger 
  WHERE (panelist_id, created_at, id) IN (
    SELECT 
      panelist_id,
      MAX(created_at) as created_at,
      MAX(id) as id
    FROM point_ledger 
    GROUP BY panelist_id
  )
) ledger_balance ON pp.user_id = ledger_balance.panelist_id
WHERE pp.user_id IN (
  SELECT id FROM users WHERE role = 'panelist'
)
ORDER BY pp.points_balance DESC; 