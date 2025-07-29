# Database Schema Implementation

This directory contains the complete database schema implementation for the Panelist Rewards Platform as specified in the Technical Design Document (TDD).

## Overview

The database schema supports a three-role architecture (panelists, survey admins, system admins) with comprehensive functionality for survey management, points tracking, and redemption processing.

## Architecture

- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Clerk.dev integration with Row Level Security (RLS)
- **Schema**: Fully normalized with proper relationships and constraints
- **Security**: Row Level Security policies for multi-tenant data isolation
- **Performance**: Optimized indexes for common query patterns

## Tables

### Core Tables

1. **users** - User accounts managed by Clerk with role information
2. **panelist_profiles** - Extended profile information for panelist users
3. **surveys** - Survey definitions with qualification criteria
4. **survey_qualifications** - Junction table for survey-panelist qualifications
5. **survey_completions** - Records of completed surveys and points earned
6. **merchant_offers** - Available offers for point redemption
7. **redemptions** - Records of point redemptions
8. **activity_log** - Audit trail of all user activities

### Custom Types

- `user_role`: panelist | survey_admin | system_admin
- `survey_status`: draft | active | inactive
- `redemption_status`: pending | completed | cancelled

## Key Features

### Security
- Row Level Security (RLS) policies for data isolation
- Role-based access control
- Automatic activity logging
- Data validation constraints

### Performance
- Comprehensive indexing strategy
- Optimized for common query patterns
- Efficient joins between related tables

### Data Integrity
- Foreign key constraints
- Check constraints for business rules
- Unique constraints to prevent duplicates
- Automatic timestamp management

### Business Logic Functions

#### `update_panelist_points(panelist_id, points_change, description)`
Safely updates panelist points balance with:
- Balance validation (prevents negative balances)
- Automatic total tracking (earned vs. redeemed)
- Activity logging
- Transaction safety

#### `log_activity(user_id, activity_type, description, metadata)`
Records user activities with:
- Structured metadata storage
- Automatic timestamps
- Flexible activity categorization

## Setup Instructions

### Local Development with Supabase

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase**
   ```bash
   supabase init
   ```

3. **Start Supabase locally**
   ```bash
   supabase start
   ```

4. **Run migrations**
   ```bash
   npm run db:migrate
   ```

5. **Seed development data**
   ```bash
   supabase db reset
   ```

### Production Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Copy project URL and API keys

2. **Configure Environment Variables**
   ```bash
   cp env.example .env.local
   # Fill in your Supabase project credentials
   ```

3. **Deploy Schema**
   ```bash
   supabase db push
   ```

## File Structure

```
database/
├── schema.sql              # Complete schema definition
├── README.md              # This documentation
└── seed.sql               # Development seed data

supabase/
├── config.toml            # Supabase configuration
├── migrations/
│   └── 20250127000001_initial_schema.sql
└── seed.sql               # Sample data for development

types/
└── database.types.ts      # TypeScript type definitions
```

## Usage Examples

### TypeScript Integration

```typescript
import { Database } from '@/types/database.types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient<Database>()

// Type-safe database operations
const { data: surveys } = await supabase
  .from('surveys')
  .select('*')
  .eq('status', 'active')
```

### Points Management

```sql
-- Award points for survey completion
SELECT update_panelist_points(
  'panelist-uuid',
  50,
  'Completed Customer Satisfaction Survey'
);

-- Redeem points for offer
SELECT update_panelist_points(
  'panelist-uuid',
  -200,
  'Redeemed $10 Amazon Gift Card'
);
```

### Activity Logging

```sql
-- Log user activity
SELECT log_activity(
  'user-id',
  'survey_completed',
  'User completed technology survey',
  '{"survey_id": "uuid", "points_earned": 75}'::jsonb
);
```

## Row Level Security Policies

The schema implements comprehensive RLS policies:

- **Panelists**: Can only access their own data
- **Survey Admins**: Can manage surveys and view qualified panelists
- **System Admins**: Full access to all data
- **Public Data**: Active surveys and offers are publicly viewable

## Migration Strategy

Migrations are managed through Supabase CLI:

1. **Create Migration**
   ```bash
   supabase migration new migration_name
   ```

2. **Apply Migrations**
   ```bash
   supabase db push
   ```

3. **Generate Types**
   ```bash
   npm run db:generate-types
   ```

## Performance Considerations

- **Indexes**: All foreign keys and commonly queried columns are indexed
- **Partitioning**: Consider partitioning activity_log by date for large datasets
- **Caching**: Implement application-level caching for frequently accessed data
- **Connection Pooling**: Use connection pooling for production deployments

## Monitoring and Maintenance

- **Query Performance**: Monitor slow queries via Supabase dashboard
- **Storage Usage**: Track database size and implement archiving strategies
- **Security Audits**: Regular review of RLS policies and access patterns
- **Backup Strategy**: Automated backups via Supabase with point-in-time recovery

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Ensure auth.uid() is properly set in your application
2. **Migration Failures**: Check for data conflicts before running destructive migrations
3. **Type Mismatches**: Regenerate types after schema changes
4. **Performance Issues**: Review query plans and index usage

### Debug Queries

```sql
-- Check RLS policy effectiveness
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM surveys WHERE status = 'active';

-- Monitor active connections
SELECT * FROM pg_stat_activity WHERE datname = 'postgres';

-- Review constraint violations
SELECT * FROM information_schema.check_constraints;
```

## Contributing

When modifying the schema:

1. Create a new migration file
2. Update TypeScript types
3. Add appropriate indexes
4. Update RLS policies if needed
5. Test with seed data
6. Update this documentation 