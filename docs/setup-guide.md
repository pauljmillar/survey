# Setup Guide

This guide walks you through setting up the PanelPro development environment from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v20.11.1 or higher
- **npm** v10.2.4 or higher
- **Git** for version control
- **PostgreSQL** (optional, if using local Supabase)

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd survey
```

## Step 2: Install Dependencies

```bash
npm install
```

This installs all required dependencies including:
- Next.js and React
- TypeScript
- Clerk.dev SDK
- Supabase client
- AWS SDK
- UI components and utilities

## Step 3: Set Up Environment Variables

### Copy Environment Template

```bash
cp env.example .env.local
```

### Required Environment Variables

Edit `.env.local` and fill in the following:

#### Database (Supabase)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Getting Supabase Credentials:**
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings > API
4. Copy the URL and keys

#### Authentication (Clerk)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

**Getting Clerk Credentials:**
1. Create account at [clerk.com](https://clerk.com)
2. Create a new application
3. Go to API Keys section
4. Copy publishable and secret keys
5. Set up webhook (see [CLERK_WEBHOOK_SETUP.md](../CLERK_WEBHOOK_SETUP.md))

#### Application Configuration

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

#### AWS S3 (for Mail Scanning)

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=survey-mail-scans
```

**Getting AWS Credentials:**
1. Create AWS account
2. Create IAM user with S3 permissions
3. Create S3 bucket for mail scans
4. Configure bucket CORS policy (see below)

### Optional: Local Supabase

For local development with Supabase:

```env
# Local Supabase (overrides production URL)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Install Supabase CLI:
```bash
npm install -g supabase
```

Initialize local Supabase:
```bash
supabase init
supabase start
```

## Step 4: Set Up Database

### Option A: Supabase Cloud

1. **Run Migrations**

   The main schema is in `database/schema.sql`. Run it in your Supabase SQL editor:

   ```bash
   # Or use Supabase dashboard SQL editor
   psql -h your-project.supabase.co -U postgres -d postgres -f database/schema.sql
   ```

2. **Run Additional Migrations**

   Run any additional migrations in `database/`:
   - `migration-mail-scanning.sql`
   - `migration-point-ledger.sql`
   - `migration-audience-management.sql`
   - etc.

3. **Generate TypeScript Types**

   ```bash
   npm run db:generate-types
   ```

   This generates `types/database.types.ts` from your database schema.

### Option B: Local Supabase

1. **Start Local Supabase**

   ```bash
   supabase start
   ```

2. **Run Migrations**

   ```bash
   supabase db reset
   ```

   This runs all migrations in `supabase/migrations/`.

3. **Generate Types**

   ```bash
   npm run db:generate-types
   ```

## Step 5: Configure Clerk Webhook

The application uses Clerk webhooks to sync user data. Set up the webhook:

1. **Create Webhook Endpoint**

   In Clerk dashboard, go to Webhooks section
   - Endpoint URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`

2. **Get Webhook Secret**

   Copy the webhook signing secret to `.env.local`:
   ```env
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

See [CLERK_WEBHOOK_SETUP.md](../CLERK_WEBHOOK_SETUP.md) for detailed instructions.

## Step 6: Configure AWS S3

### Create S3 Bucket

1. Create bucket in AWS S3 console
2. Name: `survey-mail-scans` (or your preferred name)
3. Region: Choose your preferred region

### Configure CORS

Add CORS policy to your S3 bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Configure Bucket Policy

Allow your application to upload/download:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_IAM_USER"
      },
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::survey-mail-scans/*"
    }
  ]
}
```

## Step 7: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 8: Verify Setup

### Test Authentication

1. Navigate to the landing page
2. Click "Sign Up"
3. Create a test account
4. Verify you're redirected to dashboard

### Test Database Connection

1. Sign in to the application
2. Check that your profile is created
3. Verify points balance is displayed

### Test API Endpoints

Use the API test page or Postman:

```bash
# Get points balance
curl http://localhost:3000/api/points/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Common Issues and Troubleshooting

### Issue: Database Connection Error

**Symptoms:**
- Error: "Failed to connect to database"
- API returns 500 errors

**Solutions:**
1. Verify Supabase URL and keys in `.env.local`
2. Check Supabase project is active
3. Verify network connectivity
4. Check RLS policies are set up correctly

### Issue: Authentication Not Working

**Symptoms:**
- Can't sign in/sign up
- Redirect loops

**Solutions:**
1. Verify Clerk keys in `.env.local`
2. Check Clerk application is active
3. Verify redirect URLs in Clerk dashboard:
   - After sign in: `http://localhost:3000/dashboard`
   - After sign up: `http://localhost:3000/dashboard`
4. Check webhook is configured correctly

### Issue: S3 Upload Fails

**Symptoms:**
- Mail scan uploads fail
- Presigned URL errors

**Solutions:**
1. Verify AWS credentials in `.env.local`
2. Check S3 bucket exists and is accessible
3. Verify CORS policy on S3 bucket
4. Check IAM user has S3 permissions
5. Verify bucket name matches `AWS_S3_BUCKET_NAME`

### Issue: TypeScript Errors

**Symptoms:**
- Type errors in IDE
- Build fails

**Solutions:**
1. Regenerate database types:
   ```bash
   npm run db:generate-types
   ```
2. Restart TypeScript server in IDE
3. Clear `.next` cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

### Issue: Migration Errors

**Symptoms:**
- Database migrations fail
- Schema inconsistencies

**Solutions:**
1. Check migration SQL syntax
2. Verify you're running migrations in order
3. Check for existing tables/constraints
4. Review error messages for specific issues
5. Consider resetting database (development only):
   ```bash
   npm run db:reset
   ```

### Issue: Rate Limiting

**Symptoms:**
- API returns 429 errors
- "Rate limit exceeded" messages

**Solutions:**
1. This is expected behavior for security
2. Wait for rate limit window to reset
3. Adjust rate limits in `lib/rate-limit.ts` for development

### Issue: Real-time Updates Not Working

**Symptoms:**
- Points balance doesn't update
- Activity log not refreshing

**Solutions:**
1. Verify Supabase real-time is enabled
2. Check RLS policies allow subscriptions
3. Verify Supabase client is configured correctly
4. Check browser console for WebSocket errors

## Development Workflow

### Making Database Changes

1. **Create Migration File**

   ```bash
   # Create new migration
   touch database/migration-your-feature.sql
   ```

2. **Write Migration SQL**

   ```sql
   -- Migration: Your Feature Name
   -- Add your SQL here
   ```

3. **Test Migration**

   ```bash
   # Test on local Supabase
   supabase db reset
   ```

4. **Apply to Production**

   Run migration in Supabase SQL editor or via CLI

5. **Regenerate Types**

   ```bash
   npm run db:generate-types
   ```

### Adding New API Endpoints

1. Create route file in `app/api/`
2. Add authentication with `requireAuth()`
3. Add validation with Zod schemas
4. Add rate limiting
5. Add error handling
6. Update API documentation

### Adding New Components

1. Create component in `components/`
2. Use TypeScript for type safety
3. Follow existing component patterns
4. Add to appropriate directory (panelist/admin/ui)

## Production Deployment

### Environment Variables

Set all environment variables in your hosting platform:
- Vercel: Project Settings > Environment Variables
- Other platforms: Follow their documentation

### Database

1. Use production Supabase project
2. Run all migrations
3. Set up database backups
4. Configure connection pooling

### Clerk

1. Use production Clerk application
2. Update redirect URLs for production domain
3. Configure production webhook endpoint
4. Set up monitoring

### AWS S3

1. Use production S3 bucket
2. Configure production CORS policy
3. Set up S3 bucket versioning
4. Configure lifecycle policies

### Build and Deploy

```bash
# Build for production
npm run build

# Test production build locally
npm run start
```

## Additional Resources

- [Architecture Overview](architecture.md) - System architecture
- [Database Schema](database-schema.md) - Database structure
- [API Reference](api-reference.md) - API documentation
- [CLERK_WEBHOOK_SETUP.md](../CLERK_WEBHOOK_SETUP.md) - Clerk webhook setup

## Getting Help

If you encounter issues not covered here:

1. Check error logs in browser console
2. Check server logs in terminal
3. Review database logs in Supabase dashboard
4. Check Clerk dashboard for authentication issues
5. Review AWS CloudWatch for S3 issues
6. Consult project documentation in `/docs`

