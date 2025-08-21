-- Create Survey Assignments Table
-- This table tracks which surveys are assigned to which panelists

CREATE TABLE IF NOT EXISTS survey_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  panelist_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'expired')),
  priority INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(survey_id, panelist_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_survey_assignments_survey_id ON survey_assignments(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_assignments_panelist_id ON survey_assignments(panelist_id);
CREATE INDEX IF NOT EXISTS idx_survey_assignments_status ON survey_assignments(status);
CREATE INDEX IF NOT EXISTS idx_survey_assignments_assigned_at ON survey_assignments(assigned_at DESC);

-- Enable RLS
ALTER TABLE survey_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Panelists can view own assignments" ON survey_assignments;
CREATE POLICY "Panelists can view own assignments" ON survey_assignments
  FOR SELECT USING (auth.uid()::text = panelist_id);

DROP POLICY IF EXISTS "Admins can view all assignments" ON survey_assignments;
CREATE POLICY "Admins can view all assignments" ON survey_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role IN ('survey_admin', 'system_admin')
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON survey_assignments TO authenticated;

-- Add comments
COMMENT ON TABLE survey_assignments IS 'Tracks survey assignments to panelists';
COMMENT ON COLUMN survey_assignments.status IS 'Current status of the assignment';
COMMENT ON COLUMN survey_assignments.priority IS 'Priority level (higher = more important)';
COMMENT ON COLUMN survey_assignments.expires_at IS 'When the assignment expires (optional)'; 