-- Migration: Mail Scanning System
-- Run this to add the new tables for mail scanning functionality
-- This migration is safe to run multiple times as it uses IF NOT EXISTS clauses

-- Create mail packages table (main container for mail scans)
CREATE TABLE IF NOT EXISTS mail_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panelist_id UUID NOT NULL REFERENCES panelist_profiles(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  package_description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  points_awarded INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  reviewed_by TEXT REFERENCES users(id),
  review_date TIMESTAMP WITH TIME ZONE,
  processing_notes TEXT,
  s3_key TEXT, -- Add this column for the first image thumbnail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mail scans table (individual images within a mail package)
CREATE TABLE IF NOT EXISTS mail_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panelist_id UUID NOT NULL REFERENCES panelist_profiles(id) ON DELETE CASCADE,
    mailpack_id UUID NOT NULL REFERENCES mail_packages(id) ON DELETE CASCADE,
    
    -- Image/File Information
    image_filename VARCHAR(255) NOT NULL,
    s3_bucket_name VARCHAR(100) NOT NULL DEFAULT 'survey-mail-scans',
    s3_key VARCHAR(500) NOT NULL, -- Full S3 path: folder/subfolder/filename
    file_size_bytes BIGINT,
    image_sequence INTEGER DEFAULT 1, -- Order within mailpack (1=front, 2=back, etc.)
    
    -- Content Classification
    industry VARCHAR(100), -- e.g., 'insurance', 'retail', 'automotive', 'healthcare'
    mail_type VARCHAR(50), -- e.g., 'postcard', 'catalog', 'flyer', 'envelope', 'magazine'
    brand_name VARCHAR(100), -- Company/brand sending the mail
    
    -- Processing Status
    scan_status VARCHAR(20) DEFAULT 'uploaded' CHECK (scan_status IN ('uploaded', 'processing', 'processed', 'flagged', 'approved', 'rejected')),
    processing_notes TEXT, -- Admin notes, AI analysis results, etc.
    
    -- Metadata
    scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(s3_bucket_name, s3_key) -- Prevent duplicate file uploads
);

-- Create scan sessions table (optional: track mobile app sessions)
CREATE TABLE IF NOT EXISTS scan_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panelist_id UUID NOT NULL REFERENCES panelist_profiles(id) ON DELETE CASCADE,
    device_info JSONB, -- Device type, app version, etc.
    location_data JSONB, -- Optional: GPS coordinates
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    total_scans INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance (IF NOT EXISTS not supported for indexes, so we'll use CREATE INDEX CONCURRENTLY)
-- Note: These will fail silently if indexes already exist, which is fine
DO $$ 
BEGIN
    -- Mail packages indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mail_packages_panelist_id') THEN
        CREATE INDEX idx_mail_packages_panelist_id ON mail_packages(panelist_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mail_packages_status') THEN
        CREATE INDEX idx_mail_packages_status ON mail_packages(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mail_packages_submission_date') THEN
        CREATE INDEX idx_mail_packages_submission_date ON mail_packages(submission_date DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mail_packages_reviewed_by') THEN
        CREATE INDEX idx_mail_packages_reviewed_by ON mail_packages(reviewed_by);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mail_packages_is_approved') THEN
        CREATE INDEX idx_mail_packages_is_approved ON mail_packages(is_approved);
    END IF;
    
    -- Mail scans indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mail_scans_panelist_id') THEN
        CREATE INDEX idx_mail_scans_panelist_id ON mail_scans(panelist_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mail_scans_mailpack_id') THEN
        CREATE INDEX idx_mail_scans_mailpack_id ON mail_scans(mailpack_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mail_scans_scan_date') THEN
        CREATE INDEX idx_mail_scans_scan_date ON mail_scans(scan_date);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mail_scans_status') THEN
        CREATE INDEX idx_mail_scans_status ON mail_scans(scan_status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mail_scans_industry') THEN
        CREATE INDEX idx_mail_scans_industry ON mail_scans(industry);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mail_scans_brand') THEN
        CREATE INDEX idx_mail_scans_brand ON mail_scans(brand_name);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mail_scans_s3_key') THEN
        CREATE INDEX idx_mail_scans_s3_key ON mail_scans(s3_bucket_name, s3_key);
    END IF;
    
    -- Scan sessions indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_scan_sessions_panelist_id') THEN
        CREATE INDEX idx_scan_sessions_panelist_id ON scan_sessions(panelist_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_scan_sessions_session_start') THEN
        CREATE INDEX idx_scan_sessions_session_start ON scan_sessions(session_start DESC);
    END IF;
END $$;

-- Add triggers for automatic timestamp updates (CREATE OR REPLACE for functions, DROP/CREATE for triggers)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist, then recreate them
DROP TRIGGER IF EXISTS update_mail_packages_updated_at ON mail_packages;
CREATE TRIGGER update_mail_packages_updated_at
    BEFORE UPDATE ON mail_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mail_scans_updated_at ON mail_scans;
CREATE TRIGGER update_mail_scans_updated_at
    BEFORE UPDATE ON mail_scans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE mail_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Panelists can view own mail packages" ON mail_packages;
DROP POLICY IF EXISTS "Panelists can insert own mail packages" ON mail_packages;
DROP POLICY IF EXISTS "Admins can manage all mail packages" ON mail_packages;

DROP POLICY IF EXISTS "Panelists can view own mail scans" ON mail_scans;
DROP POLICY IF EXISTS "Panelists can insert own mail scans" ON mail_scans;
DROP POLICY IF EXISTS "Admins can manage all mail scans" ON mail_scans;

DROP POLICY IF EXISTS "Panelists can view own scan sessions" ON scan_sessions;
DROP POLICY IF EXISTS "Panelists can insert own scan sessions" ON scan_sessions;
DROP POLICY IF EXISTS "Admins can view all scan sessions" ON scan_sessions;

-- Add RLS policies

-- Panelists can view their own mail packages
CREATE POLICY "Panelists can view own mail packages" ON mail_packages FOR SELECT USING (
    EXISTS (SELECT 1 FROM panelist_profiles WHERE id = panelist_id AND user_id = auth.uid()::text)
);

-- Panelists can insert their own mail packages
CREATE POLICY "Panelists can insert own mail packages" ON mail_packages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM panelist_profiles WHERE id = panelist_id AND user_id = auth.uid()::text)
);

-- Admins can view and manage all mail packages
CREATE POLICY "Admins can manage all mail packages" ON mail_packages FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('survey_admin', 'system_admin'))
);

-- Panelists can view their own mail scans
CREATE POLICY "Panelists can view own mail scans" ON mail_scans FOR SELECT USING (
    EXISTS (SELECT 1 FROM panelist_profiles WHERE id = panelist_id AND user_id = auth.uid()::text)
);

-- Panelists can insert their own mail scans
CREATE POLICY "Panelists can insert own mail scans" ON mail_scans FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM panelist_profiles WHERE id = panelist_id AND user_id = auth.uid()::text)
);

-- Admins can view and manage all mail scans
CREATE POLICY "Admins can manage all mail scans" ON mail_scans FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('survey_admin', 'system_admin'))
);

-- Panelists can view their own scan sessions
CREATE POLICY "Panelists can view own scan sessions" ON scan_sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM panelist_profiles WHERE id = panelist_id AND user_id = auth.uid()::text)
);

-- Panelists can insert their own scan sessions
CREATE POLICY "Panelists can insert own scan sessions" ON scan_sessions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM panelist_profiles WHERE id = panelist_id AND user_id = auth.uid()::text)
);

-- Admins can view all scan sessions
CREATE POLICY "Admins can view all scan sessions" ON scan_sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('survey_admin', 'system_admin'))
);

-- Add comments for documentation
COMMENT ON TABLE mail_packages IS 'Container for mail scanning submissions from panelists';
COMMENT ON TABLE mail_scans IS 'Individual scanned images within mail packages';
COMMENT ON TABLE scan_sessions IS 'Mobile app scanning sessions for analytics'; 

-- Function to update mail_packages s3_key with first image
CREATE OR REPLACE FUNCTION update_mail_package_s3_key()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the mail_package s3_key with the first image's s3_key
  UPDATE mail_packages 
  SET s3_key = (
    SELECT s3_key 
    FROM mail_scans 
    WHERE mailpack_id = NEW.mailpack_id 
    AND image_sequence = 1
    LIMIT 1
  )
  WHERE id = NEW.mailpack_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then recreate it
DROP TRIGGER IF EXISTS update_mail_package_s3_key_trigger ON mail_scans;
CREATE TRIGGER update_mail_package_s3_key_trigger
  AFTER INSERT ON mail_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_mail_package_s3_key(); 