-- Enhance Point Ledger Trigger
-- Update the trigger to sync both points_balance and total_points_earned from ledger

-- Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_update_panelist_balance ON point_ledger;

-- Create enhanced trigger function
CREATE OR REPLACE FUNCTION update_panelist_balance_from_ledger()
RETURNS TRIGGER AS $$
DECLARE
  total_earned INTEGER;
BEGIN
  -- Calculate total points earned (sum of all positive transactions)
  SELECT COALESCE(SUM(points), 0) INTO total_earned
  FROM point_ledger
  WHERE panelist_id = NEW.panelist_id
    AND points > 0;

  -- Update panelist_profiles with both balance and total earned
  UPDATE panelist_profiles
  SET
    points_balance = NEW.balance_after,
    total_points_earned = total_earned,
    updated_at = NOW()
  WHERE user_id = NEW.panelist_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER trigger_update_panelist_balance
  AFTER INSERT ON point_ledger
  FOR EACH ROW
  EXECUTE FUNCTION update_panelist_balance_from_ledger();

-- Add comment for documentation
COMMENT ON FUNCTION update_panelist_balance_from_ledger IS 'Enhanced trigger function to keep panelist_profiles.points_balance and total_points_earned in sync with ledger'; 