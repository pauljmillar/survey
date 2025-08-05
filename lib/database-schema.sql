-- Survey Questions and Responses Schema
-- This extends the existing database schema for survey functionality

-- Survey questions table
CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'text', 'rating', 'checkbox', 'yes_no', 'date_time')),
  question_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT false,
  options JSONB, -- For multiple choice/checkbox: ["Option A", "Option B", "Option C"]
  validation_rules JSONB, -- Min/max length, regex patterns, rating scale, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey responses table
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  panelist_id UUID NOT NULL REFERENCES panelist_profiles(user_id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  response_value TEXT, -- The actual answer
  response_metadata JSONB, -- Additional data like time spent, browser info, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey_id ON survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_questions_order ON survey_questions(survey_id, question_order);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_panelist_id ON survey_responses(panelist_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_question_id ON survey_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_composite ON survey_responses(survey_id, panelist_id);

-- Unique constraint to prevent duplicate responses from same panelist to same question
CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_responses_unique ON survey_responses(survey_id, panelist_id, question_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_survey_questions_updated_at 
    BEFORE UPDATE ON survey_questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Example validation rules for different question types:
-- Multiple Choice: {"min_selections": 1, "max_selections": 1}
-- Checkbox: {"min_selections": 1, "max_selections": 3}
-- Text: {"min_length": 10, "max_length": 500}
-- Rating: {"min_value": 1, "max_value": 5, "scale_type": "stars"}
-- Yes/No: {"default_value": null}
-- Date/Time: {"date_format": "YYYY-MM-DD", "time_format": "HH:MM"} 