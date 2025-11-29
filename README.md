# PanelPro

A comprehensive panelist rewards platform where users earn points by completing surveys and scanning marketing mail offers, then redeem points for merchant rewards or cash.

## Overview

PanelPro is a full-stack web application that manages a panelist rewards system. Panelists create accounts, complete surveys, and scan marketing mail to earn points. They can then redeem these points for merchant offers or cash rewards. The platform supports three distinct user roles: **Panelists**, **Survey Admins**, and **System Admins**.

### Key Features

- **Survey Management**: Panelists can browse and complete qualified surveys to earn points
- **Mail Scanning**: Panelists can scan marketing mail offers using mobile apps to earn points
- **Points System**: Comprehensive point ledger with automated bonuses and transaction tracking
- **Reward Redemption**: Redeem points for merchant offers or cash
- **Admin Dashboard**: Survey and system admins can manage surveys, panelists, and platform analytics
- **Real-time Updates**: Live updates for points balance, activity logs, and survey availability
- **Mobile API**: RESTful APIs consumed by Android and iOS mobile applications

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Authentication**: Clerk.dev
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Storage**: AWS S3 (for mail scan images)
- **UI**: Tailwind CSS & Shadcn UI
- **State Management**: TanStack Query (React Query)
- **Real-time**: Supabase real-time subscriptions

## Getting Started

### Prerequisites

- Node.js v20.11.1 or higher
- npm v10.2.4 or higher
- Supabase account (or local Supabase instance)
- Clerk.dev account
- AWS S3 bucket (for mail scanning feature)

### Installation

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd survey
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables

   Copy `.env.example` to `.env.local` and fill in your credentials:

   ```bash
   cp env.example .env.local
   ```

   Required environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
   - `CLERK_SECRET_KEY` - Clerk secret key
   - `CLERK_WEBHOOK_SECRET` - Clerk webhook secret (for user sync)
   - AWS S3 credentials (for mail scanning)

4. Set up the database

   ```bash
   # Run migrations
   npm run db:migrate

   # Generate TypeScript types
   npm run db:generate-types
   ```

5. Start the development server

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Architecture Overview](docs/architecture.md)** - System architecture and design decisions
- **[Features Guide](docs/features.md)** - Detailed feature documentation for all user roles
- **[Mail Scanning System](docs/mail-scanning-system.md)** - How the mail scanning feature works
- **[Points System](docs/points-system.md)** - Points ledger, transactions, and bonuses
- **[API Reference](docs/api-reference.md)** - API endpoints and usage
- **[Database Schema](docs/database-schema.md)** - Database structure and relationships
- **[Setup Guide](docs/setup-guide.md)** - Detailed setup instructions and troubleshooting
- **[Mobile API Authentication](docs/mobile-api-authentication.md)** - Mobile app integration guide
- **[Mobile App Profile Creation](docs/mobile-app-profile-creation.md)** - Profile creation flow for mobile apps

## Project Structure

```
survey/
├── app/                    # Next.js app router pages and API routes
│   ├── (landing-page)/    # Public landing page
│   ├── dashboard/         # Panelist dashboard
│   ├── admin/              # Admin interfaces
│   ├── api/                # API endpoints
│   └── ...
├── components/             # React components
│   ├── panelist/          # Panelist-specific components
│   ├── admin/             # Admin components
│   ├── ui/                # Reusable UI components
│   └── ...
├── database/              # Database migrations and SQL files
├── docs/                  # Documentation
├── lib/                   # Utility functions and helpers
├── hooks/                 # React hooks
├── types/                 # TypeScript type definitions
└── supabase/              # Supabase configuration
```

## Key Features

### For Panelists

- Create account and complete onboarding
- Browse and complete qualified surveys
- Scan marketing mail offers (via mobile app)
- View points balance and transaction history
- Redeem points for merchant offers or cash
- View activity log and profile

### For Survey Admins

- Create and manage surveys
- Set survey qualifications and target audiences
- View survey performance and analytics
- Manage survey assignments

### For System Admins

- Manage panelist accounts
- Manage survey admin accounts
- Create and manage merchant offers
- View platform-wide analytics
- Review and process mail scanning submissions

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run database migrations
- `npm run db:reset` - Reset database with seed data
- `npm run db:generate-types` - Generate TypeScript types from database

### Database Migrations

Database migrations are located in `database/` and `supabase/migrations/`. The main schema is defined in `database/schema.sql`.

## Security

- **Authentication**: Clerk.dev handles secure authentication
- **Authorization**: Role-based access control (RBAC) with three roles
- **Database Security**: Row Level Security (RLS) policies enforce data access
- **API Security**: Rate limiting, input validation, and error handling
- **File Storage**: Secure S3 uploads with presigned URLs

## Contributing

This is a private project. For questions or issues, please contact the development team.

## License

See [LICENSE](LICENSE) file for details.
