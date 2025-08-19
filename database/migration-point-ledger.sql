-- Point Ledger System Migration
-- This migration creates the point ledger table and associated functions for managing panelist points

-- Create the point_ledger table
CREATE TABLE IF NOT EXISTS point_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panelist_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL, -- positive for awards, negative for redemptions
  balance_after INTEGER NOT NULL, -- running balance after this transaction
  transaction_type TEXT NOT NULL, -- 'award', 'redemption', 'bonus', 'survey_completion', etc.
  title TEXT NOT NULL, -- human-readable description
  description TEXT, -- optional additional details
  metadata JSONB DEFAULT '{}', -- flexible storage for additional data
  awarded_by TEXT REFERENCES users(id), -- admin who granted points (NULL for system)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  effective_date DATE DEFAULT CURRENT_DATE -- for backdating if needed
);

-- Create indexes for efficient queries
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_point_ledger_panelist_id ON point_ledger(panelist_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_point_ledger_created_at ON point_ledger(created_at);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_point_ledger_transaction_type ON point_ledger(transaction_type);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_point_ledger_panelist_created ON point_ledger(panelist_id, created_at DESC);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add check constraint to ensure points is not zero
DO $$ BEGIN
  ALTER TABLE point_ledger ADD CONSTRAINT point_ledger_points_not_zero CHECK (points != 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add check constraint for valid transaction types
DO $$ BEGIN
  ALTER TABLE point_ledger ADD CONSTRAINT point_ledger_valid_transaction_type 
    CHECK (transaction_type IN ('award', 'redemption', 'bonus', 'survey_completion', 'manual_award', 'system_adjustment', 'referral_bonus', 'weekly_bonus'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Function to get current balance for a panelist
CREATE OR REPLACE FUNCTION get_panelist_balance(p_panelist_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT COALESCE(balance_after, 0)
  INTO current_balance
  FROM point_ledger
  WHERE panelist_id = p_panelist_id
  ORDER BY created_at DESC, id DESC
  LIMIT 1;
  
  RETURN COALESCE(current_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award points to a panelist
CREATE OR REPLACE FUNCTION award_points(
  p_panelist_id TEXT,
  p_points INTEGER,
  p_transaction_type TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_awarded_by TEXT DEFAULT NULL,
  p_effective_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
  ledger_id UUID;
BEGIN
  -- Validate inputs
  IF p_points <= 0 THEN
    RAISE EXCEPTION 'Points must be positive for awards';
  END IF;
  
  IF p_panelist_id IS NULL OR p_panelist_id = '' THEN
    RAISE EXCEPTION 'Panelist ID is required';
  END IF;
  
  IF p_title IS NULL OR p_title = '' THEN
    RAISE EXCEPTION 'Title is required';
  END IF;
  
  -- Get current balance
  current_balance := get_panelist_balance(p_panelist_id);
  new_balance := current_balance + p_points;
  
  -- Insert ledger entry
  INSERT INTO point_ledger (
    panelist_id,
    points,
    balance_after,
    transaction_type,
    title,
    description,
    metadata,
    awarded_by,
    effective_date
  ) VALUES (
    p_panelist_id,
    p_points,
    new_balance,
    p_transaction_type,
    p_title,
    p_description,
    p_metadata,
    p_awarded_by,
    p_effective_date
  ) RETURNING id INTO ledger_id;
  
  RETURN ledger_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to redeem points from a panelist
CREATE OR REPLACE FUNCTION redeem_points(
  p_panelist_id TEXT,
  p_points INTEGER,
  p_title TEXT,
  p_transaction_type TEXT DEFAULT 'redemption',
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_effective_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
  ledger_id UUID;
BEGIN
  -- Validate inputs
  IF p_points <= 0 THEN
    RAISE EXCEPTION 'Points must be positive for redemptions';
  END IF;
  
  IF p_panelist_id IS NULL OR p_panelist_id = '' THEN
    RAISE EXCEPTION 'Panelist ID is required';
  END IF;
  
  IF p_title IS NULL OR p_title = '' THEN
    RAISE EXCEPTION 'Title is required';
  END IF;
  
  -- Get current balance
  current_balance := get_panelist_balance(p_panelist_id);
  
  -- Check if panelist has enough points
  IF current_balance < p_points THEN
    RAISE EXCEPTION 'Insufficient points. Current balance: %, requested: %', current_balance, p_points;
  END IF;
  
  new_balance := current_balance - p_points;
  
  -- Insert ledger entry
  INSERT INTO point_ledger (
    panelist_id,
    points,
    balance_after,
    transaction_type,
    title,
    description,
    metadata,
    awarded_by,
    effective_date
  ) VALUES (
    p_panelist_id,
    -p_points, -- negative for redemptions
    new_balance,
    p_transaction_type,
    p_title,
    p_description,
    p_metadata,
    NULL, -- redemptions are not awarded by anyone
    p_effective_date
  ) RETURNING id INTO ledger_id;
  
  RETURN ledger_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get ledger entries for a panelist with pagination
CREATE OR REPLACE FUNCTION get_panelist_ledger(
  p_panelist_id TEXT,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_transaction_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  points INTEGER,
  balance_after INTEGER,
  transaction_type TEXT,
  title TEXT,
  description TEXT,
  metadata JSONB,
  awarded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  effective_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pl.id,
    pl.points,
    pl.balance_after,
    pl.transaction_type,
    pl.title,
    pl.description,
    pl.metadata,
    pl.awarded_by,
    pl.created_at,
    pl.effective_date
  FROM point_ledger pl
  WHERE pl.panelist_id = p_panelist_id
    AND (p_transaction_type IS NULL OR pl.transaction_type = p_transaction_type)
  ORDER BY pl.created_at DESC, pl.id DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get ledger summary for a panelist
CREATE OR REPLACE FUNCTION get_panelist_ledger_summary(p_panelist_id TEXT)
RETURNS TABLE (
  current_balance INTEGER,
  total_awarded INTEGER,
  total_redeemed INTEGER,
  transaction_count BIGINT,
  first_transaction_date TIMESTAMP WITH TIME ZONE,
  last_transaction_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    get_panelist_balance(p_panelist_id) as current_balance,
    COALESCE(SUM(CASE WHEN points > 0 THEN points ELSE 0 END), 0) as total_awarded,
    COALESCE(SUM(CASE WHEN points < 0 THEN ABS(points) ELSE 0 END), 0) as total_redeemed,
    COUNT(*) as transaction_count,
    MIN(created_at) as first_transaction_date,
    MAX(created_at) as last_transaction_date
  FROM point_ledger
  WHERE panelist_id = p_panelist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all panelists with their current balances
CREATE OR REPLACE FUNCTION get_all_panelist_balances()
RETURNS TABLE (
  panelist_id TEXT,
  current_balance INTEGER,
  total_awarded INTEGER,
  total_redeemed INTEGER,
  transaction_count BIGINT,
  last_transaction_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pl.panelist_id,
    get_panelist_balance(pl.panelist_id) as current_balance,
    COALESCE(SUM(CASE WHEN pl.points > 0 THEN pl.points ELSE 0 END), 0) as total_awarded,
    COALESCE(SUM(CASE WHEN pl.points < 0 THEN ABS(pl.points) ELSE 0 END), 0) as total_redeemed,
    COUNT(*) as transaction_count,
    MAX(pl.created_at) as last_transaction_date
  FROM point_ledger pl
  GROUP BY pl.panelist_id
  ORDER BY current_balance DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to adjust points (for corrections or system adjustments)
CREATE OR REPLACE FUNCTION adjust_points(
  p_panelist_id TEXT,
  p_points_adjustment INTEGER, -- can be positive or negative
  p_title TEXT,
  p_transaction_type TEXT DEFAULT 'system_adjustment',
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_awarded_by TEXT DEFAULT NULL,
  p_effective_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
  ledger_id UUID;
BEGIN
  -- Validate inputs
  IF p_points_adjustment = 0 THEN
    RAISE EXCEPTION 'Points adjustment cannot be zero';
  END IF;
  
  IF p_panelist_id IS NULL OR p_panelist_id = '' THEN
    RAISE EXCEPTION 'Panelist ID is required';
  END IF;
  
  IF p_title IS NULL OR p_title = '' THEN
    RAISE EXCEPTION 'Title is required';
  END IF;
  
  -- Get current balance
  current_balance := get_panelist_balance(p_panelist_id);
  new_balance := current_balance + p_points_adjustment;
  
  -- Prevent negative balance unless explicitly allowed
  IF new_balance < 0 AND p_metadata->>'allow_negative' != 'true' THEN
    RAISE EXCEPTION 'Adjustment would result in negative balance. Current: %, Adjustment: %, New: %', 
      current_balance, p_points_adjustment, new_balance;
  END IF;
  
  -- Insert ledger entry
  INSERT INTO point_ledger (
    panelist_id,
    points,
    balance_after,
    transaction_type,
    title,
    description,
    metadata,
    awarded_by,
    effective_date
  ) VALUES (
    p_panelist_id,
    p_points_adjustment,
    new_balance,
    p_transaction_type,
    p_title,
    p_description,
    p_metadata,
    p_awarded_by,
    p_effective_date
  ) RETURNING id INTO ledger_id;
  
  RETURN ledger_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for point_ledger table
ALTER TABLE point_ledger ENABLE ROW LEVEL SECURITY;

-- Policy: Panelists can view their own ledger entries
DROP POLICY IF EXISTS "Panelists can view own ledger" ON point_ledger;
CREATE POLICY "Panelists can view own ledger" ON point_ledger
  FOR SELECT USING (auth.uid()::text = panelist_id);

-- Policy: Admins can view all ledger entries
DROP POLICY IF EXISTS "Admins can view all ledger" ON point_ledger;
CREATE POLICY "Admins can view all ledger" ON point_ledger
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role IN ('survey_admin', 'system_admin')
    )
  );

-- Policy: System can insert ledger entries (for functions)
DROP POLICY IF EXISTS "System can insert ledger" ON point_ledger;
CREATE POLICY "System can insert ledger" ON point_ledger
  FOR INSERT WITH CHECK (true);

-- Create a view for easy querying of panelist balances
CREATE OR REPLACE VIEW panelist_balances AS
SELECT 
  u.id as panelist_id,
  u.email,
  pp.profile_data->>'first_name' as first_name,
  pp.profile_data->>'last_name' as last_name,
  get_panelist_balance(u.id) as current_balance,
  COALESCE(ledger_stats.total_awarded, 0) as total_awarded,
  COALESCE(ledger_stats.total_redeemed, 0) as total_redeemed,
  COALESCE(ledger_stats.transaction_count, 0) as transaction_count,
  ledger_stats.last_transaction_date
FROM users u
LEFT JOIN panelist_profiles pp ON u.id = pp.user_id
LEFT JOIN (
  SELECT 
    panelist_id,
    SUM(CASE WHEN points > 0 THEN points ELSE 0 END) as total_awarded,
    SUM(CASE WHEN points < 0 THEN ABS(points) ELSE 0 END) as total_redeemed,
    COUNT(*) as transaction_count,
    MAX(created_at) as last_transaction_date
  FROM point_ledger
  GROUP BY panelist_id
) ledger_stats ON u.id = ledger_stats.panelist_id
WHERE u.role = 'panelist';

-- Grant necessary permissions
GRANT SELECT ON panelist_balances TO authenticated;
GRANT SELECT, INSERT ON point_ledger TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE point_ledger IS 'Tracks all point transactions for panelists including awards, redemptions, and adjustments';
COMMENT ON COLUMN point_ledger.points IS 'Positive values for awards, negative values for redemptions';
COMMENT ON COLUMN point_ledger.balance_after IS 'Running balance after this transaction';
COMMENT ON COLUMN point_ledger.metadata IS 'JSON object for storing additional transaction-specific data';
COMMENT ON FUNCTION award_points IS 'Awards positive points to a panelist and creates a ledger entry';
COMMENT ON FUNCTION redeem_points IS 'Redeems points from a panelist and creates a ledger entry';
COMMENT ON FUNCTION get_panelist_balance IS 'Returns the current point balance for a panelist'; 