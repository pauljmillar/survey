# Architecture Overview

This document provides a comprehensive overview of the PanelPro application architecture, including system design, technology choices, and key components.

## System Overview

PanelPro is a full-stack web application built with Next.js that manages a panelist rewards platform. The system enables panelists to earn points through surveys and mail scanning, then redeem those points for rewards.

## Technology Stack

### Frontend

- **Next.js 14** (App Router) - React framework with server-side rendering and API routes
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Component library built on Radix UI
- **TanStack Query** - Server state management and data fetching
- **React Hooks** - Custom hooks for authentication, real-time updates, and error handling

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Clerk.dev** - Authentication and user management
- **AWS S3** - Object storage for mail scan images

### Database

- **PostgreSQL** (via Supabase) - Relational database
- **Row Level Security (RLS)** - Database-level access control
- **Real-time Subscriptions** - Live data updates via Supabase

## Application Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Web Browser   │
│  (Next.js App)  │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
┌────────▼────────┐  ┌────▼──────────┐
│  Clerk.dev      │  │  Supabase     │
│  (Auth)         │  │  (Database)    │
└─────────────────┘  └────┬────────────┘
                        │
                        │
                 ┌──────▼──────┐
                 │   AWS S3    │
                 │  (Storage)   │
                 └─────────────┘
```

### Component Architecture

The application follows a modular component architecture:

- **Pages** (`app/`) - Next.js route handlers and page components
- **API Routes** (`app/api/`) - RESTful API endpoints
- **Components** (`components/`) - Reusable React components
- **Utilities** (`lib/`) - Shared functions and helpers
- **Hooks** (`hooks/`) - Custom React hooks
- **Types** (`types/`) - TypeScript type definitions

## Authentication & Authorization

### Authentication Flow

1. User signs up/signs in via Clerk.dev
2. Clerk webhook creates user record in `users` table
3. User role is assigned (panelist, survey_admin, or system_admin)
4. Panelist profile is created automatically (via trigger or API)

### Authorization

The application uses role-based access control (RBAC) with three roles:

- **Panelist**: Can complete surveys, scan mail, redeem points
- **Survey Admin**: Can create/manage surveys, manage qualifications
- **System Admin**: Full platform access

Authorization is enforced at multiple levels:
- **API Routes**: Permission checks using `requireAuth()` utility
- **Database**: Row Level Security (RLS) policies
- **Frontend**: Route guards and conditional rendering

## Database Architecture

### Core Tables

- `users` - User accounts (synced from Clerk)
- `panelist_profiles` - Extended panelist information and points
- `surveys` - Survey definitions
- `survey_qualifications` - Survey-panelist qualification mapping
- `survey_completions` - Completed survey records
- `merchant_offers` - Available redemption options
- `redemptions` - Point redemption records
- `point_ledger` - Complete transaction history
- `activity_log` - Audit trail

### Mail Scanning Tables

- `mail_packages` - Container for mail scanning submissions
- `mail_scans` - Individual scanned images
- `scan_sessions` - Mobile app scanning sessions

### Program Management Tables

- `panelist_programs` - Available research programs
- `panelist_program_opt_ins` - Panelist program participation
- `audience_presets` - Saved audience filter configurations
- `survey_audience_assignments` - Survey-to-audience mappings

### Database Functions

Key database functions handle business logic:

- `award_points()` - Award points to panelists
- `redeem_points()` - Redeem points from panelists
- `get_panelist_balance()` - Get current points balance
- `log_activity()` - Log user activities
- `update_panelist_points()` - Safely update points balance

### Triggers

Database triggers automate point awards:

- Account signup bonus
- Mail package scan points
- Mail package review points
- Balance synchronization

## API Architecture

### API Structure

All API routes are organized under `app/api/`:

- `/api/auth/*` - Authentication and user management
- `/api/surveys/*` - Survey CRUD operations
- `/api/panelist/*` - Panelist-specific endpoints
- `/api/admin/*` - Admin endpoints
- `/api/points/*` - Points balance and history
- `/api/offers/*` - Merchant offers
- `/api/redemptions/*` - Redemption processing
- `/api/activity/*` - Activity logs
- `/api/webhooks/*` - Webhook handlers (Clerk)

### API Design Principles

- **RESTful**: Follow REST conventions
- **Type-safe**: TypeScript types for all requests/responses
- **Validated**: Zod schemas for input validation
- **Rate Limited**: Rate limiting on all endpoints
- **Error Handling**: Consistent error response format
- **Authentication**: Clerk session token required

## Real-time Features

Supabase real-time subscriptions enable live updates:

- **Points Balance**: Real-time balance updates
- **Activity Feed**: Live activity log updates
- **Survey Availability**: Real-time survey list changes
- **Redemption Status**: Live redemption tracking

## File Storage

### AWS S3 Integration

Mail scan images are stored in AWS S3:

- **Upload**: Presigned URLs for secure uploads
- **Access**: Presigned URLs for secure downloads
- **Organization**: Structured folder hierarchy
- **Metadata**: S3 keys stored in database

## Security Architecture

### Authentication Security

- Clerk.dev handles secure authentication
- Session tokens validated on every request
- Webhook verification for user sync

### Database Security

- Row Level Security (RLS) policies
- Prepared statements (via Supabase client)
- Input validation and sanitization

### API Security

- Rate limiting (in-memory, per endpoint)
- Input validation (Zod schemas)
- Error messages don't leak sensitive information
- CORS configuration

### File Storage Security

- Presigned URLs with expiration
- S3 bucket policies
- Access control via API

## State Management

### Server State

- **TanStack Query**: Manages server state, caching, and synchronization
- **Real-time Subscriptions**: Supabase subscriptions for live updates

### Client State

- **React Hooks**: Local component state
- **Context API**: Theme, authentication state

## Error Handling

### Frontend Error Handling

- Error boundaries for component errors
- User-friendly error messages
- Graceful degradation

### API Error Handling

- Standardized error response format
- HTTP status codes
- Detailed validation errors
- Error logging

## Performance Optimizations

- **Server-side Rendering**: Next.js SSR for initial page load
- **Static Generation**: Static pages where possible
- **Code Splitting**: Automatic code splitting by Next.js
- **Image Optimization**: Next.js Image component
- **Database Indexes**: Optimized queries with proper indexes
- **Caching**: TanStack Query caching strategy

## Deployment Architecture

The application is designed to be deployed on:

- **Vercel** (recommended) - Next.js hosting
- **Supabase** - Database and real-time features
- **Clerk.dev** - Authentication service
- **AWS S3** - File storage

## Mobile App Integration

The platform provides RESTful APIs consumed by Android and iOS mobile applications:

- **Authentication**: Clerk mobile SDKs
- **API Access**: Same API endpoints as web app
- **File Upload**: Presigned URLs for image uploads
- **Real-time**: WebSocket connections for live updates

See [Mobile API Authentication](mobile-api-authentication.md) for details.

## Future Architecture Considerations

- **Redis**: Replace in-memory rate limiting
- **API Versioning**: Support multiple API versions
- **GraphQL**: Consider GraphQL for complex queries
- **Microservices**: Potential service extraction
- **CDN**: Content delivery network for static assets

