# Features Guide

This document provides a comprehensive overview of all features available in PanelPro, organized by user role.

## Panelist Features

### Registration & Onboarding

**Registration Flow**
- Public landing page with registration CTAs
- Clerk.dev authentication (email, social login)
- 4-step onboarding wizard:
  1. Basic Information (age, gender)
  2. Location (country, state, city)
  3. Interests (15 categories)
  4. Demographics (income, education, employment - optional)
- Automatic panelist profile creation
- Signup bonus points awarded automatically

**Profile Management**
- View and update profile information
- Manage preferences and settings
- View account activity

### Survey System

**Browse Available Surveys**
- View list of surveys panelist is qualified for
- Filter by status, points reward, completion time
- Sort by newest first
- See survey details: title, description, points reward, estimated time
- Excludes already completed surveys

**Complete Surveys**
- Start survey from available list
- Complete survey questions
- Automatic points award upon completion
- Points immediately added to balance
- Prevents duplicate completions
- Survey completion recorded in activity log

**Survey Qualification**
- Surveys have qualification criteria (age, location, interests, etc.)
- Survey admins set qualifications per panelist
- Only qualified surveys appear in available list
- Qualification status visible to panelists

### Mail Scanning

**Scan Marketing Mail**
- Upload images of marketing mail via mobile app
- Create mail packages (containers for multiple scans)
- Each mail package can contain multiple images
- Images stored in AWS S3
- Automatic points awarded:
  - 5 points for creating a mail package
  - 5 points when package status changes to "completed"

**View Mail Packages**
- View all submitted mail packages
- See package status (pending, processing, completed, rejected)
- View individual scans within packages
- See points awarded for each package

See [Mail Scanning System](mail-scanning-system.md) for detailed information.

### Points System

**View Points Balance**
- Current points balance displayed prominently
- Total points earned (lifetime)
- Total points redeemed (lifetime)
- Real-time balance updates

**Point Ledger**
- Complete transaction history
- Filter by transaction type:
  - Survey completion
  - Mail scanning
  - Redemptions
  - Bonuses (signup, app download)
  - Manual adjustments
- View transaction details: date, amount, description
- Pagination support

**Automated Bonuses**
- Account signup bonus (automatic)
- App download bonus (when mobile app is installed)
- Mail scanning bonuses (automatic)

See [Points System](points-system.md) for detailed information.

### Redemption System

**Browse Offers**
- View available merchant offers
- Filter by points required, merchant name
- See offer details: title, description, points required, merchant
- View active offers only

**Redeem Points**
- Select offer to redeem
- System validates sufficient balance
- Points deducted from balance
- Redemption record created
- Redemption status tracking (pending, completed, cancelled)

**Redemption History**
- View all past redemptions
- Filter by status
- See redemption details and dates

### Activity Tracking

**Activity Log**
- Complete activity history
- All transactions and actions logged
- Filter by activity type
- Chronological display
- Real-time updates

### Contests

**Join Contests**
- View available contests (active and ended)
- Join active contests to compete
- See contest details: dates, prize points, description
- Filter by status: Active, Ended, My Contests

**Contest Participation**
- View current rank and points earned
- See leaderboard with top participants
- Real-time updates for active contests
- Historical view of ended contests

**Leaderboards**
- Full ranked leaderboard for each contest
- See your position and nearby participants
- Points earned during contest period
- Contest status indicators

### Dashboard

**Panelist Dashboard**
- Welcome message with name
- Prominent points balance display
- Available surveys list
- Recent activity summary
- Quick access to key features

## Survey Admin Features

### Survey Management

**Create Surveys**
- Create new surveys with:
  - Title and description
  - Points reward
  - Estimated completion time
  - Qualification criteria (JSON)
  - Status (draft, active, inactive)
- Save as draft or publish immediately

**Edit Surveys**
- Update survey details
- Change points reward
- Modify qualification criteria
- Update status

**Delete Surveys**
- Remove surveys (with proper permissions)
- Cascade deletion of qualifications and completions

**View Survey Performance**
- Completion rates
- Response quality metrics
- Audience reach
- Performance analytics

### Qualification Management

**Set Survey Qualifications**
- Browse panelist list
- Set qualification flags per survey
- Bulk qualification updates
- Filter panelists by demographics
- View qualification status

**Audience Management**
- Create audience presets (saved filter configurations)
- Assign audiences to surveys
- View audience count per survey
- Temporary audience assignments

### Survey Analytics

**Survey Metrics**
- Total completions
- Completion rate
- Average completion time
- Points distributed
- Response quality

### Contest Management

**Create Contests**
- Create contests with start/end dates
- Set prize points
- Choose invite type: All Panelists or Select Panelists
- Save as draft or start immediately

**Manage Contests**
- View all contests with status filters
- Start draft contests
- End active contests
- Edit contest details (draft only)
- View participant counts

**Contest Administration**
- View participant list with ranks and points
- Update leaderboard manually
- Award prizes to participants (after contest ends)
- Invite additional panelists to contests
- View contest analytics

## System Admin Features

### User Management

**Manage Panelists**
- View all panelist accounts
- Search and filter panelists
- View panelist details:
  - Profile information
  - Points balance
  - Survey completions
  - Activity history
- Activate/deactivate accounts
- Delete accounts (with proper safeguards)

**Manage Survey Admins**
- Create survey admin accounts
- Set admin permissions
- Activate/deactivate admins
- View admin activity

### Offer Management

**Create Merchant Offers**
- Create new redemption offers
- Set points required
- Add merchant information
- Set offer details
- Activate/deactivate offers

**Edit Offers**
- Update offer details
- Change points required
- Modify merchant information
- Update offer status

**Delete Offers**
- Remove offers (with proper checks)

### Mail Scanning Administration

**Review Mail Packages**
- View all submitted mail packages
- Review individual scans
- Approve/reject packages
- Set package status
- Add review notes
- View S3 images

**Mail Scanning Analytics**
- Total packages submitted
- Packages by status
- Points awarded for mail scanning
- Processing time metrics

### Platform Analytics

**System-wide Metrics**
- Total panelists
- Active panelists
- Total surveys created
- Total surveys completed
- Total points distributed
- Total points redeemed
- Redemption rate
- Platform engagement metrics

**Reporting**
- User engagement reports
- Survey performance reports
- Points distribution reports
- Redemption reports

### Point Ledger Management

**View All Transactions**
- Complete point ledger across all panelists
- Filter by panelist, transaction type, date
- Search transactions
- Export transaction data

**Manual Point Adjustments**
- Award points manually
- Adjust points balance
- Add adjustment notes
- Track who made adjustments

## Common Features (All Roles)

### Navigation

**Top Navigation Bar**
- Logo and branding
- Menu items (role-based)
- Theme toggle (dark/light mode)
- Profile dropdown
- Sign in/out buttons

**Sidebar Navigation**
- Collapsible left sidebar
- Role-based menu items
- Expandable submenus
- Keyboard navigation
- Mobile responsive

### Theme System

**Dark/Light Mode**
- System preference detection
- Manual theme toggle
- Persistent theme selection
- Smooth transitions

### Real-time Updates

**Live Data**
- Points balance updates
- Activity log updates
- Survey availability changes
- Redemption status updates

### Error Handling

**User-friendly Errors**
- Clear error messages
- Graceful error handling
- Empty state messages
- Loading states

### Responsive Design

**Mobile Support**
- Mobile-first design
- Touch-friendly interactions
- Responsive layouts
- Mobile menu

## Feature Access Matrix

| Feature | Panelist | Survey Admin | System Admin |
|---------|----------|--------------|--------------|
| Complete Surveys | ✅ | ❌ | ❌ |
| Scan Mail | ✅ | ❌ | ❌ |
| Redeem Points | ✅ | ❌ | ❌ |
| Join Contests | ✅ | ❌ | ❌ |
| View Own Activity | ✅ | ✅ | ✅ |
| Create Surveys | ❌ | ✅ | ✅ |
| Manage Qualifications | ❌ | ✅ | ✅ |
| View Survey Analytics | ❌ | ✅ | ✅ |
| Manage Contests | ❌ | ✅ | ✅ |
| Manage Panelists | ❌ | ❌ | ✅ |
| Manage Offers | ❌ | ❌ | ✅ |
| Platform Analytics | ❌ | ❌ | ✅ |
| Review Mail Packages | ❌ | ❌ | ✅ |

## Future Features

Planned enhancements include:

- **Live Surveys**: Real-time survey participation
- **Advanced Analytics**: Detailed reporting and insights
- **Payment Integration**: Direct payment processing
- **Multi-tenancy**: Support for multiple organizations
- **Referral System**: Panelist referral bonuses
- **Gamification**: Badges, achievements, leaderboards
- **Email Notifications**: Survey invitations, redemption confirmations
- **Push Notifications**: Mobile app notifications

