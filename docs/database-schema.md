# Database Schema

This document provides an overview of the PanelPro database schema, including tables, relationships, indexes, and security policies.

## Overview

The database uses PostgreSQL via Supabase with Row Level Security (RLS) for access control. The schema supports three user roles: panelists, survey admins, and system admins.

## Core Tables

### Users

Stores user account information synced from Clerk.

```sql
users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email VARCHAR(255) NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'panelist',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Relationships:**
- One-to-one with `panelist_profiles`
- One-to-many with `surveys` (created_by)
- One-to-many with `activity_log`

### Panelist Profiles

Extended profile information for panelist users.

```sql
panelist_profiles (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  total_points_earned INTEGER NOT NULL DEFAULT 0,
  total_points_redeemed INTEGER NOT NULL DEFAULT 0,
  surveys_completed INTEGER NOT NULL DEFAULT 0,
  total_scans INTEGER NOT NULL DEFAULT 0,
  profile_data JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
)
```

**Relationships:**
- One-to-one with `users`
- One-to-many with `survey_qualifications`
- One-to-many with `survey_completions`
- One-to-many with `redemptions`
- One-to-many with `mail_packages`
- One-to-many with `point_ledger`

### Surveys

Survey definitions with qualification criteria.

```sql
surveys (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  points_reward INTEGER NOT NULL CHECK (points_reward > 0),
  estimated_completion_time INTEGER NOT NULL CHECK (estimated_completion_time > 0),
  qualification_criteria JSONB DEFAULT '{}',
  audience_count INTEGER DEFAULT 0,
  status survey_status NOT NULL DEFAULT 'draft',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Relationships:**
- Many-to-one with `users` (created_by)
- One-to-many with `survey_qualifications`
- One-to-many with `survey_completions`
- One-to-many with `survey_audience_assignments`

### Survey Qualifications

Junction table for survey-panelist qualifications.

```sql
survey_qualifications (
  id UUID PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  panelist_id UUID NOT NULL REFERENCES panelist_profiles(id) ON DELETE CASCADE,
  is_qualified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(survey_id, panelist_id)
)
```

**Relationships:**
- Many-to-one with `surveys`
- Many-to-one with `panelist_profiles`

### Survey Completions

Records of completed surveys.

```sql
survey_completions (
  id UUID PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES surveys(id),
  panelist_id UUID NOT NULL REFERENCES panelist_profiles(id),
  points_earned INTEGER NOT NULL CHECK (points_earned >= 0),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_data JSONB DEFAULT '{}',
  UNIQUE(survey_id, panelist_id) -- Prevent duplicate completions
)
```

**Relationships:**
- Many-to-one with `surveys`
- Many-to-one with `panelist_profiles`

### Merchant Offers

Available redemption options.

```sql
merchant_offers (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL CHECK (points_required > 0),
  merchant_name VARCHAR(255) NOT NULL,
  offer_details JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Relationships:**
- One-to-many with `redemptions`

### Redemptions

Point redemption records.

```sql
redemptions (
  id UUID PRIMARY KEY,
  panelist_id UUID NOT NULL REFERENCES panelist_profiles(id),
  offer_id UUID NOT NULL REFERENCES merchant_offers(id),
  points_spent INTEGER NOT NULL CHECK (points_spent > 0),
  status redemption_status NOT NULL DEFAULT 'pending',
  redemption_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Relationships:**
- Many-to-one with `panelist_profiles`
- Many-to-one with `merchant_offers`

### Point Ledger

Complete transaction history for all point movements.

```sql
point_ledger (
  id UUID PRIMARY KEY,
  panelist_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL, -- Positive for awards, negative for redemptions
  balance_after INTEGER NOT NULL, -- Running balance after this transaction
  transaction_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  awarded_by TEXT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  effective_date DATE DEFAULT CURRENT_DATE,
  CHECK (points != 0)
)
```

**Relationships:**
- Many-to-one with `users` (panelist_id)
- Many-to-one with `users` (awarded_by)

**Transaction Types:**
- `survey_completion`
- `redemption`
- `manual_award`
- `system_adjustment`
- `account_signup_bonus`
- `app_download_bonus`
- `mail_package_scan`
- `mail_pack_review`

### Activity Log

Audit trail of all user activities.

```sql
activity_log (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  activity_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Relationships:**
- Many-to-one with `users`

## Mail Scanning Tables

### Mail Packages

Container for mail scanning submissions.

```sql
mail_packages (
  id UUID PRIMARY KEY,
  panelist_id UUID NOT NULL REFERENCES panelist_profiles(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  package_description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  points_awarded INTEGER DEFAULT 0,
  industry TEXT,
  brand_name TEXT,
  company_validated BOOLEAN DEFAULT FALSE,
  response_intention TEXT,
  name_check TEXT,
  is_approved BOOLEAN DEFAULT false,
  reviewed_by TEXT REFERENCES users(id),
  review_date TIMESTAMP WITH TIME ZONE,
  processing_notes TEXT,
  s3_key TEXT, -- First image thumbnail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Relationships:**
- Many-to-one with `panelist_profiles`
- One-to-many with `mail_scans`

### Mail Scans

Individual scanned images within a mail package.

```sql
mail_scans (
  id UUID PRIMARY KEY,
  panelist_id UUID NOT NULL REFERENCES panelist_profiles(id) ON DELETE CASCADE,
  mailpack_id UUID NOT NULL REFERENCES mail_packages(id) ON DELETE CASCADE,
  image_filename VARCHAR(255) NOT NULL,
  s3_bucket_name VARCHAR(100) NOT NULL DEFAULT 'survey-mail-scans',
  s3_key VARCHAR(500) NOT NULL,
  file_size_bytes BIGINT,
  image_sequence INTEGER DEFAULT 1,
  industry VARCHAR(100),
  mail_type VARCHAR(50),
  brand_name VARCHAR(100),
  scan_status VARCHAR(20) DEFAULT 'uploaded' CHECK (scan_status IN ('uploaded', 'processing', 'processed', 'flagged', 'approved', 'rejected')),
  processing_notes TEXT,
  scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(s3_bucket_name, s3_key)
)
```

**Relationships:**
- Many-to-one with `panelist_profiles`
- Many-to-one with `mail_packages`

### Scan Sessions

Mobile app scanning sessions for analytics.

```sql
scan_sessions (
  id UUID PRIMARY KEY,
  panelist_id UUID NOT NULL REFERENCES panelist_profiles(id) ON DELETE CASCADE,
  device_info JSONB,
  location_data JSONB,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  total_scans INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Relationships:**
- Many-to-one with `panelist_profiles`

## Program Management Tables

### Panelist Programs

Available research programs for panelists.

```sql
panelist_programs (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Relationships:**
- One-to-many with `panelist_program_opt_ins`

### Panelist Program Opt-ins

Panelist program participation records.

```sql
panelist_program_opt_ins (
  id UUID PRIMARY KEY,
  panelist_id UUID NOT NULL REFERENCES panelist_profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES panelist_programs(id) ON DELETE CASCADE,
  opted_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opted_out_at TIMESTAMP WITH TIME ZONE NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(panelist_id, program_id)
)
```

**Relationships:**
- Many-to-one with `panelist_profiles`
- Many-to-one with `panelist_programs`

### Audience Presets

Saved audience filter configurations for admins.

```sql
audience_presets (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  filter_criteria JSONB NOT NULL,
  audience_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Relationships:**
- Many-to-one with `users` (created_by)
- One-to-many with `survey_audience_assignments`

### Survey Audience Assignments

Survey assignments to audience presets.

```sql
survey_audience_assignments (
  id UUID PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  audience_preset_id UUID NOT NULL REFERENCES audience_presets(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by TEXT NOT NULL REFERENCES users(id),
  assignment_metadata JSONB DEFAULT '{}'
)
```

**Relationships:**
- Many-to-one with `surveys`
- Many-to-one with `audience_presets`
- Many-to-one with `users` (assigned_by)

## Contest Tables

### Contests

Contest definitions with start/end dates and prizes.

```sql
contests (
  id UUID PRIMARY KEY,
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
)
```

**Relationships:**
- Many-to-one with `users` (created_by)
- One-to-many with `contest_invitations`
- One-to-many with `contest_participants`
- One-to-many with `contest_prize_awards`

### Contest Invitations

Contest invitations to specific panelists.

```sql
contest_invitations (
  id UUID PRIMARY KEY,
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  panelist_id UUID NOT NULL REFERENCES panelist_profiles(id) ON DELETE CASCADE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by TEXT NOT NULL REFERENCES users(id),
  UNIQUE(contest_id, panelist_id)
)
```

**Relationships:**
- Many-to-one with `contests`
- Many-to-one with `panelist_profiles`
- Many-to-one with `users` (invited_by)

### Contest Participants

Panelists who have joined contests with points and rankings.

```sql
contest_participants (
  id UUID PRIMARY KEY,
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  panelist_id UUID NOT NULL REFERENCES panelist_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  points_earned INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  prize_awarded BOOLEAN NOT NULL DEFAULT false,
  prize_awarded_at TIMESTAMP WITH TIME ZONE,
  prize_awarded_by TEXT REFERENCES users(id),
  UNIQUE(contest_id, panelist_id)
)
```

**Relationships:**
- Many-to-one with `contests`
- Many-to-one with `panelist_profiles`
- Many-to-one with `users` (prize_awarded_by)

### Contest Prize Awards

Audit trail of contest prize awards.

```sql
contest_prize_awards (
  id UUID PRIMARY KEY,
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  panelist_id UUID NOT NULL REFERENCES panelist_profiles(id) ON DELETE CASCADE,
  points_awarded INTEGER NOT NULL CHECK (points_awarded > 0),
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  awarded_by TEXT NOT NULL REFERENCES users(id),
  ledger_entry_id UUID REFERENCES point_ledger(id)
)
```

**Relationships:**
- Many-to-one with `contests`
- Many-to-one with `panelist_profiles`
- Many-to-one with `users` (awarded_by)
- Many-to-one with `point_ledger`

## Custom Types

### User Role Enum

```sql
CREATE TYPE user_role AS ENUM ('panelist', 'survey_admin', 'system_admin');
```

### Survey Status Enum

```sql
CREATE TYPE survey_status AS ENUM ('draft', 'active', 'inactive');
```

### Redemption Status Enum

```sql
CREATE TYPE redemption_status AS ENUM ('pending', 'completed', 'cancelled');
```

### Contest Status Enum

```sql
CREATE TYPE contest_status AS ENUM ('draft', 'active', 'ended', 'cancelled');
```

### Contest Invite Type Enum

```sql
CREATE TYPE contest_invite_type AS ENUM ('all_panelists', 'selected_panelists');
```

## Indexes

### Performance Indexes

Key indexes for query optimization:

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Panelist Profiles
CREATE INDEX idx_panelist_profiles_user_id ON panelist_profiles(user_id);
CREATE INDEX idx_panelist_profiles_points_balance ON panelist_profiles(points_balance);
CREATE INDEX idx_panelist_profiles_is_active ON panelist_profiles(is_active);

-- Surveys
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_created_by ON surveys(created_by);
CREATE INDEX idx_surveys_created_at ON surveys(created_at DESC);

-- Survey Qualifications
CREATE INDEX idx_survey_qualifications_survey_id ON survey_qualifications(survey_id);
CREATE INDEX idx_survey_qualifications_panelist_id ON survey_qualifications(panelist_id);
CREATE INDEX idx_survey_qualifications_qualified ON survey_qualifications(is_qualified);

-- Survey Completions
CREATE INDEX idx_survey_completions_survey_id ON survey_completions(survey_id);
CREATE INDEX idx_survey_completions_panelist_id ON survey_completions(panelist_id);
CREATE INDEX idx_survey_completions_completed_at ON survey_completions(completed_at DESC);

-- Point Ledger
CREATE INDEX idx_point_ledger_panelist_id ON point_ledger(panelist_id);
CREATE INDEX idx_point_ledger_created_at ON point_ledger(created_at);
CREATE INDEX idx_point_ledger_transaction_type ON point_ledger(transaction_type);
CREATE INDEX idx_point_ledger_panelist_created ON point_ledger(panelist_id, created_at DESC);

-- Activity Log
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_activity_type ON activity_log(activity_type);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
```

## Database Functions

### Award Points

```sql
award_points(
  p_panelist_id TEXT,
  p_points INTEGER,
  p_transaction_type TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_awarded_by TEXT DEFAULT NULL,
  p_effective_date DATE DEFAULT CURRENT_DATE
) RETURNS UUID
```

Awards points to a panelist and creates a ledger entry.

### Redeem Points

```sql
redeem_points(
  p_panelist_id TEXT,
  p_points INTEGER,
  p_title TEXT,
  p_transaction_type TEXT DEFAULT 'redemption',
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_effective_date DATE DEFAULT CURRENT_DATE
) RETURNS UUID
```

Redeems points from a panelist and creates a ledger entry.

### Get Panelist Balance

```sql
get_panelist_balance(p_panelist_id TEXT) RETURNS INTEGER
```

Returns the current points balance for a panelist.

### Log Activity

```sql
log_activity(
  p_user_id TEXT,
  p_activity_type VARCHAR(100),
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
```

Logs a user activity to the activity log.

### Update Panelist Points

```sql
update_panelist_points(
  p_panelist_id UUID,
  p_points_change INTEGER,
  p_activity_description TEXT
) RETURNS BOOLEAN
```

Safely updates panelist points balance with validation.

### Calculate Contest Points

```sql
calculate_contest_points(
  p_contest_id UUID,
  p_panelist_id UUID
) RETURNS INTEGER
```

Calculates total points earned by a panelist during the contest period from point_ledger.

### Update Contest Leaderboard

```sql
update_contest_leaderboard(p_contest_id UUID) RETURNS VOID
```

Recalculates points_earned for all participants and updates ranks based on points (descending).

### Award Contest Prize

```sql
award_contest_prize(
  p_contest_id UUID,
  p_panelist_id UUID,
  p_awarded_by TEXT
) RETURNS UUID
```

Awards prize points to a contest participant, creates point_ledger entry, and updates contest_participants record.

## Database Triggers

### Automatic Timestamp Updates

All tables with `updated_at` columns have triggers to automatically update timestamps on row updates.

### Point Balance Synchronization

```sql
CREATE TRIGGER trigger_update_panelist_balance
  AFTER INSERT ON point_ledger
  FOR EACH ROW
  EXECUTE FUNCTION update_panelist_balance_from_ledger();
```

Keeps `panelist_profiles.points_balance` in sync with the ledger.

### Mail Package Points

```sql
CREATE TRIGGER trigger_mail_package_scan_points
  AFTER INSERT ON mail_packages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_mail_package_scan_points();

CREATE TRIGGER trigger_mail_package_review_points
  AFTER UPDATE ON mail_packages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_mail_package_review_points();
```

Automatically awards points for mail package creation and completion.

## Row Level Security (RLS)

RLS policies enforce data access at the database level:

### Users

- Users can view and update their own profile

### Panelist Profiles

- Panelists can view and update their own profile
- Admins can view all profiles

### Surveys

- Anyone can view active surveys
- Survey admins can manage surveys

### Survey Qualifications

- Panelists can view their own qualifications
- Admins can manage all qualifications

### Survey Completions

- Panelists can view and create their own completions
- Admins can view all completions

### Point Ledger

- Panelists can view their own ledger entries
- Admins can view all ledger entries

### Mail Packages & Scans

- Panelists can view and create their own packages/scans
- Admins can view and manage all packages/scans

### Merchant Offers

- Anyone can view active offers
- System admins can manage offers

### Redemptions

- Panelists can view and create their own redemptions
- Admins can view all redemptions

## Relationships Diagram

```
users
  ├── panelist_profiles (1:1)
  │     ├── survey_qualifications (1:many)
  │     ├── survey_completions (1:many)
  │     ├── redemptions (1:many)
  │     ├── mail_packages (1:many)
  │     └── point_ledger (1:many)
  ├── surveys (1:many, created_by)
  │     ├── survey_qualifications (1:many)
  │     ├── survey_completions (1:many)
  │     └── survey_audience_assignments (1:many)
  └── activity_log (1:many)

mail_packages
  └── mail_scans (1:many)

panelist_programs
  └── panelist_program_opt_ins (1:many)
      └── panelist_profiles (many:1)

audience_presets
  └── survey_audience_assignments (1:many)
      └── surveys (many:1)
```

## Schema Files

- **Main Schema**: `database/schema.sql` - Complete schema definition
- **Migrations**: `database/migration-*.sql` - Individual feature migrations
- **Supabase Migrations**: `supabase/migrations/` - Supabase migration files

## Additional Resources

- [Points System](points-system.md) - Detailed points system documentation
- [Mail Scanning System](mail-scanning-system.md) - Mail scanning schema details
- [Database README](../database/README.md) - Database-specific documentation

