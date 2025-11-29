-- Contest System Migration
-- This migration creates the contest system tables and associated functions

-- Create contest status enum
DO $$ BEGIN
  CREATE TYPE contest_status AS ENUM ('draft', 'active', 'ended', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create contest invite type enum
DO $$ BEGIN
  CREATE TYPE contest_invite_type AS ENUM ('all_panelists', 'selected_panelists');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create contests table
CREATE TABLE IF NOT EXISTS contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  prize_points INTEGER NOT NULL CHECK (prize_points > 0),
  status contest_status NOT NULL DEFAULT 'draft',
  invite_type contest_invite_type NOT NULL DEFAULT 'all_panelists',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT contests_end_after_start CHECK (end_date > start_date)
);

-- Create contest_invitations table
CREATE TABLE IF NOT EXISTS contest_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  panelist_id UUID NOT NULL REFERENCES panelist_profiles(id) ON DELETE CASCADE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by TEXT NOT NULL REFERENCES users(id),
  UNIQUE(contest_id, panelist_id)
);

-- Create contest_participants table
CREATE TABLE IF NOT EXISTS contest_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  panelist_id UUID NOT NULL REFERENCES panelist_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  points_earned INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  prize_awarded BOOLEAN NOT NULL DEFAULT false,
  prize_awarded_at TIMESTAMP WITH TIME ZONE,
  prize_awarded_by TEXT REFERENCES users(id),
  UNIQUE(contest_id, panelist_id)
);

-- Create contest_prize_awards table (audit trail)
CREATE TABLE IF NOT EXISTS contest_prize_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  panelist_id UUID NOT NULL REFERENCES panelist_profiles(id) ON DELETE CASCADE,
  points_awarded INTEGER NOT NULL CHECK (points_awarded > 0),
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  awarded_by TEXT NOT NULL REFERENCES users(id),
  ledger_entry_id UUID REFERENCES point_ledger(id)
);

-- Create indexes
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contests_dates ON contests(start_date, end_date);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contests_created_by ON contests(created_by);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contest_participants_contest ON contest_participants(contest_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contest_participants_panelist ON contest_participants(panelist_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contest_participants_rank ON contest_participants(contest_id, rank);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contest_invitations_contest ON contest_invitations(contest_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contest_invitations_panelist ON contest_invitations(panelist_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contest_prize_awards_contest ON contest_prize_awards(contest_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contest_prize_awards_panelist ON contest_prize_awards(panelist_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Function to calculate contest points for a panelist
CREATE OR REPLACE FUNCTION calculate_contest_points(
  p_contest_id UUID,
  p_panelist_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  contest_start TIMESTAMP WITH TIME ZONE;
  contest_end TIMESTAMP WITH TIME ZONE;
  total_points INTEGER;
BEGIN
  -- Get contest dates
  SELECT start_date, end_date
  INTO contest_start, contest_end
  FROM contests
  WHERE id = p_contest_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contest not found';
  END IF;
  
  -- Calculate points earned during contest period
  -- Only count positive transactions (points earned)
  SELECT COALESCE(SUM(points), 0)
  INTO total_points
  FROM point_ledger
  WHERE panelist_id = (SELECT user_id FROM panelist_profiles WHERE id = p_panelist_id)
    AND points > 0
    AND created_at >= contest_start
    AND created_at <= contest_end;
  
  RETURN COALESCE(total_points, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update contest leaderboard
CREATE OR REPLACE FUNCTION update_contest_leaderboard(p_contest_id UUID)
RETURNS VOID AS $$
DECLARE
  participant_record RECORD;
  calculated_points INTEGER;
BEGIN
  -- Recalculate points for all participants
  FOR participant_record IN
    SELECT cp.id, cp.panelist_id
    FROM contest_participants cp
    WHERE cp.contest_id = p_contest_id
    ORDER BY cp.id
  LOOP
    -- Calculate points for this participant
    calculated_points := calculate_contest_points(p_contest_id, participant_record.panelist_id);
    
    -- Update points_earned
    UPDATE contest_participants
    SET points_earned = calculated_points
    WHERE id = participant_record.id;
  END LOOP;
  
  -- Update ranks using DENSE_RANK to handle ties properly
  -- Participants with same points get same rank
  WITH ranked_participants AS (
    SELECT 
      id,
      points_earned,
      DENSE_RANK() OVER (ORDER BY points_earned DESC, joined_at ASC) as calculated_rank
    FROM contest_participants
    WHERE contest_id = p_contest_id
  )
  UPDATE contest_participants cp
  SET rank = rp.calculated_rank
  FROM ranked_participants rp
  WHERE cp.id = rp.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award contest prize
CREATE OR REPLACE FUNCTION award_contest_prize(
  p_contest_id UUID,
  p_panelist_id UUID,
  p_awarded_by TEXT
)
RETURNS UUID AS $$
DECLARE
  contest_prize_points INTEGER;
  panelist_user_id TEXT;
  ledger_entry_id UUID;
  prize_award_id UUID;
BEGIN
  -- Get contest prize points
  SELECT prize_points
  INTO contest_prize_points
  FROM contests
  WHERE id = p_contest_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contest not found';
  END IF;
  
  -- Get panelist user_id
  SELECT user_id
  INTO panelist_user_id
  FROM panelist_profiles
  WHERE id = p_panelist_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Panelist not found';
  END IF;
  
  -- Check if prize already awarded
  IF EXISTS (
    SELECT 1 FROM contest_participants
    WHERE contest_id = p_contest_id
      AND panelist_id = p_panelist_id
      AND prize_awarded = true
  ) THEN
    RAISE EXCEPTION 'Prize already awarded to this participant';
  END IF;
  
  -- Award points using award_points function
  SELECT award_points(
    panelist_user_id,
    contest_prize_points,
    'contest_prize',
    'Contest Prize: ' || (SELECT title FROM contests WHERE id = p_contest_id),
    'Prize awarded for contest participation',
    jsonb_build_object('contest_id', p_contest_id::text),
    p_awarded_by,
    CURRENT_DATE
  ) INTO ledger_entry_id;
  
  -- Update contest_participants
  UPDATE contest_participants
  SET prize_awarded = true,
      prize_awarded_at = NOW(),
      prize_awarded_by = p_awarded_by
  WHERE contest_id = p_contest_id
    AND panelist_id = p_panelist_id;
  
  -- Create prize award record
  INSERT INTO contest_prize_awards (
    contest_id,
    panelist_id,
    points_awarded,
    awarded_by,
    ledger_entry_id
  ) VALUES (
    p_contest_id,
    p_panelist_id,
    contest_prize_points,
    p_awarded_by,
    ledger_entry_id
  ) RETURNING id INTO prize_award_id;
  
  RETURN ledger_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS trigger_update_contests_updated_at ON contests;
  CREATE TRIGGER trigger_update_contests_updated_at
    BEFORE UPDATE ON contests
    FOR EACH ROW
    EXECUTE FUNCTION update_contests_updated_at();
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- Add 'contest_prize' to valid transaction types in point_ledger
-- Note: This assumes the constraint exists. If it doesn't, it will be added when the constraint is created.
DO $$ BEGIN
  -- Check if constraint exists and update it
  ALTER TABLE point_ledger DROP CONSTRAINT IF EXISTS point_ledger_valid_transaction_type;
  ALTER TABLE point_ledger ADD CONSTRAINT point_ledger_valid_transaction_type 
    CHECK (transaction_type IN (
      'award', 'redemption', 'bonus', 'survey_completion', 'manual_award', 
      'system_adjustment', 'referral_bonus', 'weekly_bonus', 'account_signup_bonus', 
      'app_download_bonus', 'mail_package_scan', 'mail_pack_review', 'contest_prize'
    ));
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- Row Level Security Policies

-- Contests: Admins can view/manage all, panelists can view active contests they're invited to or all active contests (if invite_type = 'all_panelists')
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all contests" ON contests;
CREATE POLICY "Admins can manage all contests" ON contests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role IN ('survey_admin', 'system_admin')
    )
  );

DROP POLICY IF EXISTS "Panelists can view active contests" ON contests;
CREATE POLICY "Panelists can view active contests" ON contests
  FOR SELECT USING (
    status IN ('active', 'ended')
    AND (
      invite_type = 'all_panelists'
      OR EXISTS (
        SELECT 1 FROM contest_invitations ci
        WHERE ci.contest_id = contests.id
        AND ci.panelist_id IN (
          SELECT id FROM panelist_profiles WHERE user_id = auth.uid()::text
        )
      )
    )
  );

-- Contest invitations: Admins can manage all, panelists can view their own
ALTER TABLE contest_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all contest invitations" ON contest_invitations;
CREATE POLICY "Admins can manage all contest invitations" ON contest_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role IN ('survey_admin', 'system_admin')
    )
  );

DROP POLICY IF EXISTS "Panelists can view their own invitations" ON contest_invitations;
CREATE POLICY "Panelists can view their own invitations" ON contest_invitations
  FOR SELECT USING (
    panelist_id IN (
      SELECT id FROM panelist_profiles WHERE user_id = auth.uid()::text
    )
  );

-- Contest participants: Admins can view/manage all, panelists can view their own participation
ALTER TABLE contest_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all contest participants" ON contest_participants;
CREATE POLICY "Admins can manage all contest participants" ON contest_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role IN ('survey_admin', 'system_admin')
    )
  );

DROP POLICY IF EXISTS "Panelists can view their own participation" ON contest_participants;
CREATE POLICY "Panelists can view their own participation" ON contest_participants
  FOR SELECT USING (
    panelist_id IN (
      SELECT id FROM panelist_profiles WHERE user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Panelists can insert their own participation" ON contest_participants;
CREATE POLICY "Panelists can insert their own participation" ON contest_participants
  FOR INSERT WITH CHECK (
    panelist_id IN (
      SELECT id FROM panelist_profiles WHERE user_id = auth.uid()::text
    )
  );

-- Contest participants can view leaderboard for contests they've joined
DROP POLICY IF EXISTS "Participants can view contest leaderboard" ON contest_participants;
CREATE POLICY "Participants can view contest leaderboard" ON contest_participants
  FOR SELECT USING (
    -- Allow if user is a participant in this contest
    panelist_id IN (
      SELECT id FROM panelist_profiles WHERE user_id = auth.uid()::text
    )
    OR
    -- Allow if contest is active/ended and user is admin
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role IN ('survey_admin', 'system_admin')
    )
    OR
    -- Allow if contest is active/ended and open to all
    EXISTS (
      SELECT 1 FROM contests c
      WHERE c.id = contest_participants.contest_id
      AND c.status IN ('active', 'ended')
      AND c.invite_type = 'all_panelists'
    )
  );

-- Contest prize awards: Admins can view all, panelists can view their own
ALTER TABLE contest_prize_awards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all prize awards" ON contest_prize_awards;
CREATE POLICY "Admins can view all prize awards" ON contest_prize_awards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role IN ('survey_admin', 'system_admin')
    )
  );

DROP POLICY IF EXISTS "Panelists can view their own prize awards" ON contest_prize_awards;
CREATE POLICY "Panelists can view their own prize awards" ON contest_prize_awards
  FOR SELECT USING (
    panelist_id IN (
      SELECT id FROM panelist_profiles WHERE user_id = auth.uid()::text
    )
  );

-- Comments for documentation
COMMENT ON TABLE contests IS 'Contest definitions with start/end dates and prizes';
COMMENT ON TABLE contest_invitations IS 'Contest invitations to specific panelists';
COMMENT ON TABLE contest_participants IS 'Panelists who have joined contests with points and rankings';
COMMENT ON TABLE contest_prize_awards IS 'Audit trail of contest prize awards';
COMMENT ON FUNCTION calculate_contest_points IS 'Calculates total points earned by a panelist during contest period';
COMMENT ON FUNCTION update_contest_leaderboard IS 'Recalculates points and ranks for all participants in a contest';
COMMENT ON FUNCTION award_contest_prize IS 'Awards prize points to a contest participant and creates audit trail';

