-- Migration: Audience Management System
-- Run this to add the new tables and functions for program-based audience management

-- Create new tables for program management
CREATE TABLE panelist_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Panelist program opt-ins (many-to-many)
CREATE TABLE panelist_program_opt_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panelist_id UUID NOT NULL REFERENCES panelist_profiles(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES panelist_programs(id) ON DELETE CASCADE,
    opted_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    opted_out_at TIMESTAMP WITH TIME ZONE NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(panelist_id, program_id)
);

-- Audience presets for admin use
CREATE TABLE audience_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    filter_criteria JSONB NOT NULL,
    audience_count INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey audience assignments
CREATE TABLE survey_audience_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    audience_preset_id UUID NOT NULL REFERENCES audience_presets(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by TEXT NOT NULL REFERENCES users(id),
    assignment_metadata JSONB DEFAULT '{}'
);

-- Add new indexes for performance optimization
CREATE INDEX idx_panelist_programs_is_active ON panelist_programs(is_active);
CREATE INDEX idx_panelist_programs_name ON panelist_programs(name);

CREATE INDEX idx_panelist_program_opt_ins_panelist_id ON panelist_program_opt_ins(panelist_id);
CREATE INDEX idx_panelist_program_opt_ins_program_id ON panelist_program_opt_ins(program_id);
CREATE INDEX idx_panelist_program_opt_ins_active ON panelist_program_opt_ins(program_id, is_active) WHERE is_active = true;

CREATE INDEX idx_audience_presets_created_by ON audience_presets(created_by);
CREATE INDEX idx_audience_presets_created_at ON audience_presets(created_at DESC);

CREATE INDEX idx_survey_audience_assignments_survey_id ON survey_audience_assignments(survey_id);
CREATE INDEX idx_survey_audience_assignments_preset_id ON survey_audience_assignments(audience_preset_id);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_panelist_programs_updated_at 
    BEFORE UPDATE ON panelist_programs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_panelist_program_opt_ins_updated_at 
    BEFORE UPDATE ON panelist_program_opt_ins 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audience_presets_updated_at 
    BEFORE UPDATE ON audience_presets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for new tables
ALTER TABLE panelist_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE panelist_program_opt_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_audience_assignments ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for new tables

-- Programs are public for viewing
CREATE POLICY "Anyone can view active programs" ON panelist_programs FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage programs" ON panelist_programs FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('survey_admin', 'system_admin'))
);

-- Panelists can view and manage their own program opt-ins
CREATE POLICY "Panelists can view own program opt-ins" ON panelist_program_opt_ins FOR SELECT USING (
    EXISTS (SELECT 1 FROM panelist_profiles WHERE id = panelist_id AND user_id = auth.uid()::text)
);
CREATE POLICY "Panelists can manage own program opt-ins" ON panelist_program_opt_ins FOR ALL USING (
    EXISTS (SELECT 1 FROM panelist_profiles WHERE id = panelist_id AND user_id = auth.uid()::text)
);

-- Admins can view all program opt-ins
CREATE POLICY "Admins can view all program opt-ins" ON panelist_program_opt_ins FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('survey_admin', 'system_admin'))
);

-- Audience presets can be managed by admins
CREATE POLICY "Admins can manage audience presets" ON audience_presets FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('survey_admin', 'system_admin'))
);

-- Survey audience assignments can be managed by admins
CREATE POLICY "Admins can manage survey audience assignments" ON survey_audience_assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('survey_admin', 'system_admin'))
);

-- Add helper functions for program management
CREATE OR REPLACE FUNCTION opt_into_program(
    p_panelist_id UUID,
    p_program_name VARCHAR(100),
    p_opt_in BOOLEAN DEFAULT true
)
RETURNS BOOLEAN AS $$
DECLARE
    program_id_val UUID;
    existing_opt_in UUID;
BEGIN
    -- Get the program ID
    SELECT id INTO program_id_val
    FROM panelist_programs 
    WHERE name = p_program_name AND is_active = true;
    
    IF program_id_val IS NULL THEN
        RAISE EXCEPTION 'Program not found or inactive: %', p_program_name;
    END IF;
    
    -- Check if opt-in already exists
    SELECT id INTO existing_opt_in
    FROM panelist_program_opt_ins
    WHERE panelist_id = p_panelist_id AND program_id = program_id_val;
    
    IF p_opt_in THEN
        -- Opt in
        IF existing_opt_in IS NULL THEN
            -- Create new opt-in
            INSERT INTO panelist_program_opt_ins (panelist_id, program_id, is_active)
            VALUES (p_panelist_id, program_id_val, true);
        ELSE
            -- Reactivate existing opt-in
            UPDATE panelist_program_opt_ins 
            SET is_active = true, opted_out_at = NULL, updated_at = NOW()
            WHERE id = existing_opt_in;
        END IF;
    ELSE
        -- Opt out
        IF existing_opt_in IS NOT NULL THEN
            UPDATE panelist_program_opt_ins 
            SET is_active = false, opted_out_at = NOW(), updated_at = NOW()
            WHERE id = existing_opt_in;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add a function to get panelist's active programs
CREATE OR REPLACE FUNCTION get_panelist_programs(p_panelist_id UUID)
RETURNS TABLE (
    program_name VARCHAR(100),
    display_name VARCHAR(255),
    description TEXT,
    opted_in_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.name,
        pp.display_name,
        pp.description,
        ppo.opted_in_at,
        ppo.is_active
    FROM panelist_program_opt_ins ppo
    JOIN panelist_programs pp ON ppo.program_id = pp.id
    WHERE ppo.panelist_id = p_panelist_id
    ORDER BY pp.display_name;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE panelist_programs IS 'Available research programs for panelists';
COMMENT ON TABLE panelist_program_opt_ins IS 'Panelist program participation records';
COMMENT ON TABLE audience_presets IS 'Saved audience filter configurations for admins';
COMMENT ON TABLE survey_audience_assignments IS 'Survey assignments to audience presets';