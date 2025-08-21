-- Update Point Ledger Transaction Type Constraint
-- This script updates the constraint to include the new automated bonus types

-- Drop the existing constraint
ALTER TABLE point_ledger DROP CONSTRAINT IF EXISTS point_ledger_valid_transaction_type;

-- Add the updated constraint with all transaction types
ALTER TABLE point_ledger ADD CONSTRAINT point_ledger_valid_transaction_type 
  CHECK (transaction_type IN (
    'award', 
    'redemption', 
    'bonus', 
    'survey_completion', 
    'manual_award', 
    'system_adjustment', 
    'referral_bonus', 
    'weekly_bonus',
    'account_signup_bonus',
    'app_download_bonus'
  ));

-- Verify the constraint was updated
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'point_ledger_valid_transaction_type'; 