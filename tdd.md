# Technical Design Document (TDD)

This document outlines the system architecture and technical design decisions derived from the BRD for the panelist rewards platform.

---

## 🧭 Overview

The application is a comprehensive panelist rewards platform where users can earn points by completing surveys and redeem them for merchant offers or cash. The system supports three distinct roles: panelists, survey admins, and system admins, each with specific permissions and capabilities.

---

## 🏗️ System Architecture

### Technology Stack
- **Frontend:** Next.js 14 with App Router and Tailwind CSS
- **Backend:** Node.js API Routes with serverless functions
- **Authentication:** Clerk.dev for role-based access control
- **Database:** PostgreSQL (Supabase) with real-time subscriptions
- **State Management:** React Context + Server State (TanStack Query)
- **Deployment:** Vercel with edge functions
- **Monitoring:** Vercel Analytics + custom logging

### Database Schema

#### Core Tables
```sql
-- Users table (managed by Clerk)
users (
  id (Clerk user ID),
  email,
  role (panelist|survey_admin|system_admin),
  created_at,
  updated_at
)

-- Panelist profiles
panelist_profiles (
  id,
  user_id (FK to users),
  points_balance,
  total_points_earned,
  total_points_redeemed,
  profile_data (JSON),
  is_active,
  created_at,
  updated_at
)

-- Surveys
surveys (
  id,
  title,
  description,
  points_reward,
  estimated_completion_time,
  qualification_criteria (JSON),
  status (draft|active|inactive),
  created_by (FK to users),
  created_at,
  updated_at
)

-- Survey qualifications (many-to-many)
survey_qualifications (
  id,
  survey_id (FK to surveys),
  panelist_id (FK to panelist_profiles),
  is_qualified,
  created_at
)

-- Survey completions
survey_completions (
  id,
  survey_id (FK to surveys),
  panelist_id (FK to panelist_profiles),
  points_earned,
  completed_at,
  response_data (JSON)
)

-- Merchant offers
merchant_offers (
  id,
  title,
  description,
  points_required,
  merchant_name,
  offer_details (JSON),
  is_active,
  created_at,
  updated_at
)

-- Redemptions
redemptions (
  id,
  panelist_id (FK to panelist_profiles),
  offer_id (FK to merchant_offers),
  points_spent,
  status (pending|completed|cancelled),
  redemption_date,
  created_at
)

-- Activity log
activity_log (
  id,
  user_id (FK to users),
  activity_type,
  description,
  metadata (JSON),
  created_at
)
```

---

## 🧩 Component Architecture

### Frontend Components

#### Core Layout Components
- `AppLayout` - Main application wrapper with navigation
- `SidebarLayout` - Dashboard sidebar with role-based navigation
- `AuthGuard` - Route protection based on user role
- `PointsDisplay` - Reusable points balance component

#### Panelist Components
- `PanelistDashboard` - Main dashboard with surveys and balance
- `SurveyList` - Displays available surveys with filtering
- `SurveyCard` - Individual survey display with completion button
- `RedemptionCenter` - Browse and redeem merchant offers
- `ActivityFeed` - Chronological activity history
- `ProfileManager` - Profile and account settings

#### Survey Admin Components
- `SurveyAdminDashboard` - Survey management overview
- `SurveyCreator` - Create and edit surveys
- `QualificationManager` - Manage panelist qualifications
- `SurveyAnalytics` - Performance metrics and reports

#### System Admin Components
- `SystemAdminDashboard` - Platform-wide analytics
- `UserManagement` - Manage all user accounts
- `OfferManagement` - Create and manage merchant offers
- `PlatformAnalytics` - System-wide metrics

### Backend Services

#### Authentication Service
- Role-based access control
- Session management
- Permission validation

#### Points Service
- Points calculation and validation
- Balance updates with transaction safety
- Points history tracking

#### Survey Service
- Survey CRUD operations
- Qualification management
- Completion tracking
- Performance analytics

#### Redemption Service
- Offer management
- Redemption processing
- Balance validation

#### Analytics Service
- User engagement metrics
- Survey performance data
- Platform-wide statistics

---

## 🔐 Security & Permissions

### Role-Based Access Control
```typescript
enum UserRole {
  PANELIST = 'panelist',
  SURVEY_ADMIN = 'survey_admin',
  SYSTEM_ADMIN = 'system_admin'
}

interface Permission {
  resource: string;
  action: string;
  roles: UserRole[];
}
```

### Permission Matrix
| Resource | Panelist | Survey Admin | System Admin |
|----------|----------|--------------|--------------|
| View own profile | ✅ | ✅ | ✅ |
| Complete surveys | ✅ | ❌ | ❌ |
| Redeem points | ✅ | ❌ | ❌ |
| Create surveys | ❌ | ✅ | ✅ |
| Manage qualifications | ❌ | ✅ | ✅ |
| View all users | ❌ | ❌ | ✅ |
| Manage offers | ❌ | ❌ | ✅ |

---

## 📱 UI/UX Design Decisions

### Design Principles
- **Mobile-first responsive design**
- **Card-based layout** for surveys and offers
- **Prominent points display** on all pages
- **Minimal, clean interface** focusing on functionality
- **Real-time updates** for points and activity

### Key UI Components
- **Points Header** - Always visible current balance
- **Survey Cards** - Clean, scannable survey information
- **Activity Feed** - Chronological transaction history
- **Redemption Grid** - Visual offer browsing
- **Progress Indicators** - Survey completion status

---

## 🔄 Data Flow

### Survey Completion Flow
1. Panelist views available surveys
2. Clicks to start survey
3. Completes survey (external or internal)
4. System validates completion
5. Points automatically added to balance
6. Activity logged
7. Real-time UI updates

### Redemption Flow
1. Panelist browses available offers
2. Selects offer to redeem
3. System validates sufficient balance
4. Points deducted from balance
5. Redemption record created
6. Activity logged
7. Real-time UI updates

---

## 🚀 Performance Considerations

### Optimization Strategies
- **Server-side rendering** for initial page loads
- **Incremental static regeneration** for survey lists
- **Real-time subscriptions** for points updates
- **Optimistic updates** for better UX
- **Lazy loading** for non-critical components

### Caching Strategy
- **Redis** for session data and temporary caching
- **CDN** for static assets
- **Database query optimization** with proper indexing
- **Client-side caching** for frequently accessed data

---

## 🧪 Testing Strategy

### Test Types
- **Unit tests** for business logic services
- **Integration tests** for API endpoints
- **E2E tests** for critical user flows
- **Performance tests** for high-traffic scenarios

### Key Test Scenarios
- Survey completion and points awarding
- Redemption with insufficient balance
- Role-based access control
- Real-time updates
- Mobile responsiveness

---

## 📊 Monitoring & Analytics

### Key Metrics
- Survey completion rates
- Points distribution patterns
- Redemption conversion rates
- User engagement metrics
- System performance indicators

### Logging Strategy
- **Structured logging** for all transactions
- **Error tracking** with stack traces
- **Performance monitoring** for API endpoints
- **User activity tracking** for analytics

---

## 🔄 Change Log

| Date       | Agent | Note |
|------------|-------|------|
| 2025-01-27 | SR    | Complete redesign for three-role architecture |
| 2025-01-27 | SR    | Added comprehensive database schema |
| 2025-01-27 | SR    | Defined component architecture and security model |
| 2025-07-28 | SR    | Initial architecture draft for MVP |
