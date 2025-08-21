-- Add Total Scans Field to Panelist Profiles
-- This script adds a total_scans field to track the total number of scans for each panelist

-- Add total_scans column to panelist_profiles
ALTER TABLE panelist_profiles 
ADD COLUMN IF NOT EXISTS total_scans INTEGER NOT NULL DEFAULT 0 CHECK (total_scans >= 0);

-- Create function to calculate total scans for a panelist
CREATE OR REPLACE FUNCTION calculate_panelist_total_scans(p_panelist_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_from_packages INTEGER;
  total_from_sessions INTEGER;
BEGIN
  -- Calculate total from mail_packages
  SELECT COALESCE(SUM(total_images), 0) INTO total_from_packages
  FROM mail_packages
  WHERE panelist_id = p_panelist_id;
  
  -- Calculate total from scan_sessions
  SELECT COALESCE(SUM(total_scans), 0) INTO total_from_sessions
  FROM scan_sessions
  WHERE panelist_id = p_panelist_id;
  
  RETURN total_from_packages + total_from_sessions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update panelist total scans
CREATE OR REPLACE FUNCTION update_panelist_total_scans(p_panelist_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE panelist_profiles
  SET 
    total_scans = calculate_panelist_total_scans(p_panelist_id),
    updated_at = NOW()
  WHERE id = p_panelist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for mail_packages
CREATE OR REPLACE FUNCTION trigger_update_scans_from_packages()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_scans when mail_packages is inserted, updated, or deleted
  PERFORM update_panelist_total_scans(NEW.panelist_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for scan_sessions
CREATE OR REPLACE FUNCTION trigger_update_scans_from_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_scans when scan_sessions is inserted, updated, or deleted
  PERFORM update_panelist_total_scans(NEW.panelist_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_scans_from_packages ON mail_packages;
CREATE TRIGGER trigger_update_scans_from_packages
  AFTER INSERT OR UPDATE OR DELETE ON mail_packages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_scans_from_packages();

DROP TRIGGER IF EXISTS trigger_update_scans_from_sessions ON scan_sessions;
CREATE TRIGGER trigger_update_scans_from_sessions
  AFTER INSERT OR UPDATE OR DELETE ON scan_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_scans_from_sessions();

-- Initialize total_scans for existing panelists
UPDATE panelist_profiles 
SET total_scans = calculate_panelist_total_scans(id)
WHERE total_scans = 0;

-- Add comments for documentation
COMMENT ON COLUMN panelist_profiles.total_scans IS 'Total number of scans (images + session scans) for this panelist';
COMMENT ON FUNCTION calculate_panelist_total_scans IS 'Calculates total scans from mail_packages and scan_sessions';
COMMENT ON FUNCTION update_panelist_total_scans IS 'Updates panelist_profiles.total_scans for a given panelist'; 