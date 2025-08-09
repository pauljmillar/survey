-- Seed data for panelist programs
-- This should be run after the main schema.sql

-- Insert initial programs
INSERT INTO panelist_programs (name, display_name, description) VALUES
  ('surveys', 'Online Surveys', 'Traditional online surveys with points rewards'),
  ('real_time_surveys', 'Real-time Surveys', 'Live survey opportunities with immediate feedback'),
  ('email_panelist', 'Email Research', 'Email-based research studies and feedback'),
  ('tiktok_panelist', 'TikTok Research', 'TikTok content research and social media studies');

-- Add a function to help panelists opt into programs
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