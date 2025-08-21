-- Fix Total Scans Function
-- This script fixes the calculate_panelist_total_scans function to handle different panelist_id types

-- Drop the existing function
DROP FUNCTION IF EXISTS calculate_panelist_total_scans(UUID);

-- Create corrected function to calculate total scans for a panelist
CREATE OR REPLACE FUNCTION calculate_panelist_total_scans(p_panelist_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_from_packages INTEGER;
  total_from_sessions INTEGER;
  user_id_text TEXT;
BEGIN
  -- Get the user_id (text) for this panelist
  SELECT user_id INTO user_id_text
  FROM panelist_profiles
  WHERE id = p_panelist_id;
  
  -- Calculate total from mail_packages (uses UUID panelist_id)
  SELECT COALESCE(SUM(total_images), 0) INTO total_from_packages
  FROM mail_packages
  WHERE panelist_id = p_panelist_id;
  
  -- Calculate total from scan_sessions (uses TEXT panelist_id = user_id)
  SELECT COALESCE(SUM(total_scans), 0) INTO total_from_sessions
  FROM scan_sessions
  WHERE panelist_id = user_id_text;
  
  RETURN total_from_packages + total_from_sessions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the function comment
COMMENT ON FUNCTION calculate_panelist_total_scans IS 'Calculates total scans from mail_packages (UUID panelist_id) and scan_sessions (TEXT panelist_id)';

-- Initialize total_scans for existing panelists
UPDATE panelist_profiles 
SET total_scans = calculate_panelist_total_scans(id)
WHERE total_scans = 0; 