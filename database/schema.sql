-- Panelist Rewards Platform Database Schema
-- Based on TDD specifications for three-role architecture

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" = 'your-jwt-secret';

-- Create custom types
CREATE TYPE user_role AS ENUM ('panelist', 'survey_admin', 'system_admin');
CREATE TYPE survey_status AS ENUM ('draft', 'active', 'inactive');
CREATE TYPE redemption_status AS ENUM ('pending', 'completed', 'cancelled');

-- Users table (metadata for Clerk users)
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- Clerk user ID
    email VARCHAR(255) NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'panelist',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Panelist profiles
CREATE TABLE panelist_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    total_points_earned INTEGER NOT NULL DEFAULT 0 CHECK (total_points_earned >= 0),
    total_points_redeemed INTEGER NOT NULL DEFAULT 0 CHECK (total_points_redeemed >= 0),
    surveys_completed INTEGER NOT NULL DEFAULT 0 CHECK (surveys_completed >= 0),
    profile_data JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Surveys
CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_reward INTEGER NOT NULL CHECK (points_reward > 0),
    estimated_completion_time INTEGER NOT NULL CHECK (estimated_completion_time > 0), -- in minutes
    qualification_criteria JSONB DEFAULT '{}',
    audience_count INTEGER DEFAULT 0,
    status survey_status NOT NULL DEFAULT 'draft',
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey qualifications (many-to-many between surveys and panelists)
CREATE TABLE survey_qualifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    panelist_id UUID NOT NULL REFERENCES panelist_profiles(id) ON DELETE CASCADE,
    is_qualified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(survey_id, panelist_id)
);

-- Survey completions
CREATE TABLE survey_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id),
    panelist_id UUID NOT NULL REFERENCES panelist_profiles(id),
    points_earned INTEGER NOT NULL CHECK (points_earned >= 0),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_data JSONB DEFAULT '{}',
    UNIQUE(survey_id, panelist_id) -- Prevent duplicate completions
);

-- Merchant offers
CREATE TABLE merchant_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL CHECK (points_required > 0),
    merchant_name VARCHAR(255) NOT NULL,
    offer_details JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Redemptions
CREATE TABLE redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panelist_id UUID NOT NULL REFERENCES panelist_profiles(id),
    offer_id UUID NOT NULL REFERENCES merchant_offers(id),
    points_spent INTEGER NOT NULL CHECK (points_spent > 0),
    status redemption_status NOT NULL DEFAULT 'pending',
    redemption_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id),
    activity_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Panelist programs
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

-- Indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_panelist_profiles_user_id ON panelist_profiles(user_id);
CREATE INDEX idx_panelist_profiles_points_balance ON panelist_profiles(points_balance);
CREATE INDEX idx_panelist_profiles_is_active ON panelist_profiles(is_active);

CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_created_by ON surveys(created_by);
CREATE INDEX idx_surveys_created_at ON surveys(created_at DESC);

CREATE INDEX idx_survey_qualifications_survey_id ON survey_qualifications(survey_id);
CREATE INDEX idx_survey_qualifications_panelist_id ON survey_qualifications(panelist_id);
CREATE INDEX idx_survey_qualifications_qualified ON survey_qualifications(is_qualified);

CREATE INDEX idx_survey_completions_survey_id ON survey_completions(survey_id);
CREATE INDEX idx_survey_completions_panelist_id ON survey_completions(panelist_id);
CREATE INDEX idx_survey_completions_completed_at ON survey_completions(completed_at DESC);

CREATE INDEX idx_merchant_offers_is_active ON merchant_offers(is_active);
CREATE INDEX idx_merchant_offers_points_required ON merchant_offers(points_required);

CREATE INDEX idx_redemptions_panelist_id ON redemptions(panelist_id);
CREATE INDEX idx_redemptions_offer_id ON redemptions(offer_id);
CREATE INDEX idx_redemptions_status ON redemptions(status);
CREATE INDEX idx_redemptions_redemption_date ON redemptions(redemption_date DESC);

CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_activity_type ON activity_log(activity_type);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- Program management indexes
CREATE INDEX idx_panelist_programs_is_active ON panelist_programs(is_active);
CREATE INDEX idx_panelist_programs_name ON panelist_programs(name);

CREATE INDEX idx_panelist_program_opt_ins_panelist_id ON panelist_program_opt_ins(panelist_id);
CREATE INDEX idx_panelist_program_opt_ins_program_id ON panelist_program_opt_ins(program_id);
CREATE INDEX idx_panelist_program_opt_ins_active ON panelist_program_opt_ins(program_id, is_active) WHERE is_active = true;

-- Audience management indexes
CREATE INDEX idx_audience_presets_created_by ON audience_presets(created_by);
CREATE INDEX idx_audience_presets_created_at ON audience_presets(created_at DESC);

CREATE INDEX idx_survey_audience_assignments_survey_id ON survey_audience_assignments(survey_id);
CREATE INDEX idx_survey_audience_assignments_preset_id ON survey_audience_assignments(audience_preset_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_panelist_profiles_updated_at 
    BEFORE UPDATE ON panelist_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at 
    BEFORE UPDATE ON surveys 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_offers_updated_at 
    BEFORE UPDATE ON merchant_offers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

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

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id TEXT,
    p_activity_type VARCHAR(100),
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO activity_log (user_id, activity_type, description, metadata)
    VALUES (p_user_id, p_activity_type, p_description, p_metadata)
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update panelist points balance safely
CREATE OR REPLACE FUNCTION update_panelist_points(
    p_panelist_id UUID,
    p_points_change INTEGER,
    p_activity_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance INTEGER;
    user_id_val TEXT;
BEGIN
    -- Get current balance and user_id
    SELECT points_balance, user_id INTO current_balance, user_id_val
    FROM panelist_profiles 
    WHERE id = p_panelist_id;
    
    -- Check if panelist exists
    IF current_balance IS NULL THEN
        RAISE EXCEPTION 'Panelist not found';
    END IF;
    
    -- Check for sufficient balance on negative changes
    IF p_points_change < 0 AND current_balance + p_points_change < 0 THEN
        RAISE EXCEPTION 'Insufficient points balance';
    END IF;
    
    -- Update balance and totals
    UPDATE panelist_profiles 
    SET 
        points_balance = points_balance + p_points_change,
        total_points_earned = CASE 
            WHEN p_points_change > 0 THEN total_points_earned + p_points_change 
            ELSE total_points_earned 
        END,
        total_points_redeemed = CASE 
            WHEN p_points_change < 0 THEN total_points_redeemed + ABS(p_points_change)
            ELSE total_points_redeemed 
        END,
        updated_at = NOW()
    WHERE id = p_panelist_id;
    
    -- Log the activity
    PERFORM log_activity(
        user_id_val,
        CASE WHEN p_points_change > 0 THEN 'points_earned' ELSE 'points_redeemed' END,
        p_activity_description,
        jsonb_build_object('points_change', p_points_change, 'panelist_id', p_panelist_id)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE panelist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id);

-- Panelists can only see their own profile
CREATE POLICY "Panelists can view own profile" ON panelist_profiles FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Panelists can update own profile" ON panelist_profiles FOR UPDATE USING (auth.uid()::text = user_id);

-- Survey access based on role
CREATE POLICY "Anyone can view active surveys" ON surveys FOR SELECT USING (status = 'active');
CREATE POLICY "Survey admins can manage surveys" ON surveys FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('survey_admin', 'system_admin'))
);

-- Qualifications can be viewed by panelists and admins
CREATE POLICY "Panelists can view own qualifications" ON survey_qualifications FOR SELECT USING (
    EXISTS (SELECT 1 FROM panelist_profiles WHERE id = panelist_id AND user_id = auth.uid()::text)
);
CREATE POLICY "Admins can manage qualifications" ON survey_qualifications FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('survey_admin', 'system_admin'))
);

-- Completions can be viewed by panelists and admins
CREATE POLICY "Panelists can view own completions" ON survey_completions FOR SELECT USING (
    EXISTS (SELECT 1 FROM panelist_profiles WHERE id = panelist_id AND user_id = auth.uid()::text)
);
CREATE POLICY "Panelists can insert own completions" ON survey_completions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM panelist_profiles WHERE id = panelist_id AND user_id = auth.uid()::text)
);

-- Merchant offers are public for viewing
CREATE POLICY "Anyone can view active offers" ON merchant_offers FOR SELECT USING (is_active = true);
CREATE POLICY "System admins can manage offers" ON merchant_offers FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'system_admin')
);

-- Redemptions can be viewed and created by panelists
CREATE POLICY "Panelists can view own redemptions" ON redemptions FOR SELECT USING (
    EXISTS (SELECT 1 FROM panelist_profiles WHERE id = panelist_id AND user_id = auth.uid()::text)
);
CREATE POLICY "Panelists can create own redemptions" ON redemptions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM panelist_profiles WHERE id = panelist_id AND user_id = auth.uid()::text)
);

-- Activity log can be viewed by users for their own activities
CREATE POLICY "Users can view own activity" ON activity_log FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "System can insert activity" ON activity_log FOR INSERT WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts managed by Clerk with role information';
COMMENT ON TABLE panelist_profiles IS 'Extended profile information for panelist users';
COMMENT ON TABLE surveys IS 'Survey definitions with qualification criteria';
COMMENT ON TABLE survey_qualifications IS 'Junction table for survey-panelist qualifications';
COMMENT ON TABLE survey_completions IS 'Records of completed surveys and points earned';
COMMENT ON TABLE merchant_offers IS 'Available offers for point redemption';
COMMENT ON TABLE redemptions IS 'Records of point redemptions';
COMMENT ON TABLE activity_log IS 'Audit trail of all user activities';

COMMENT ON FUNCTION update_panelist_points IS 'Safely update panelist points balance with validation and logging';
COMMENT ON FUNCTION log_activity IS 'Log user activity with metadata'; 