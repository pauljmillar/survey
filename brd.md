# Business Requirements Document (BRD)

This document contains high-level business requirements and use cases for the panelist rewards application.

## 🧭 Product Summary

A panelist rewards platform where users can earn points by completing surveys they're qualified for and redeem points for merchant offers or cash. The platform supports three distinct roles: panelists, survey admins, and system admins.

---

## 🧩 Use Cases

### Panelist Role Use Cases

#### UC01 – Panelist Registration and Authentication
**Priority:** High  
**Status:** Active  
**Description:**  
Panelists can register for an account, sign in securely, and manage their profile information. The public landing page explains the earning opportunity and encourages registration.

#### UC02 – View Points Balance
**Priority:** High  
**Status:** Active  
**Description:**  
Panelists can view their current points balance prominently displayed on their dashboard and throughout the app.

#### UC03 – Browse Available Surveys
**Priority:** High  
**Status:** Active  
**Description:**  
Panelists can view a list of surveys they're qualified for, sorted by newest first. Each survey shows the points reward and estimated completion time.

#### UC04 – Complete Survey and Earn Points
**Priority:** High  
**Status:** Active  
**Description:**  
Panelists can complete surveys they're qualified for and automatically earn points upon completion. Points are immediately added to their balance.

#### UC05 – Browse Redemption Options
**Priority:** High  
**Status:** Active  
**Description:**  
Panelists can view available redemption options including merchant offers (e.g., "$20 off $50 purchase at Merchant X") and cash conversion options.

#### UC06 – Redeem Points for Rewards
**Priority:** High  
**Status:** Active  
**Description:**  
Panelists can redeem their points for merchant offers or convert to cash. If balance is insufficient, an error is shown.

#### UC07 – View Activity Log
**Priority:** Medium  
**Status:** Active  
**Description:**  
Panelists can view their complete activity history including surveys completed, points earned, and redemptions made.

#### UC08 – Manage Profile
**Priority:** Medium  
**Status:** Active  
**Description:**  
Panelists can view and update their profile information, preferences, and account settings.

### Survey Admin Role Use Cases

#### UC09 – Survey Admin Authentication
**Priority:** High  
**Status:** Active  
**Description:**  
Survey admins can securely log in with appropriate role-based access to survey management features.

#### UC10 – Create New Surveys
**Priority:** High  
**Status:** Active  
**Description:**  
Survey admins can create new surveys with details including title, description, points reward, estimated completion time, and qualification criteria.

#### UC11 – Manage Survey Qualifications
**Priority:** High  
**Status:** Active  
**Description:**  
Survey admins can browse the panelist list and set qualification flags for specific surveys. Qualified panelists will see these surveys in their available list.

#### UC12 – View Survey Performance
**Priority:** Medium  
**Status:** Active  
**Description:**  
Survey admins can view completion rates, response quality, and other performance metrics for their surveys.

### System Admin Role Use Cases

#### UC13 – System Admin Authentication
**Priority:** High  
**Status:** Active  
**Description:**  
System admins can securely log in with full administrative access to all platform features.

#### UC14 – Manage Panelist Accounts
**Priority:** High  
**Status:** Active  
**Description:**  
System admins can view, deactivate, or delete panelist accounts and manage account status.

#### UC15 – Manage Survey Admins
**Priority:** Medium  
**Status:** Active  
**Description:**  
System admins can create, modify, or deactivate survey admin accounts and manage their permissions.

#### UC16 – Platform Analytics
**Priority:** Medium  
**Status:** Active  
**Description:**  
System admins can view platform-wide analytics including total surveys completed, points distributed, redemption rates, and user engagement metrics.

#### UC17 – Manage Merchant Offers
**Priority:** Medium  
**Status:** Active  
**Description:**  
System admins can create, edit, or deactivate merchant offers available for redemption.

---

## 🎨 Design Requirements

- **Minimal Design:** Clean, uncluttered interface with focus on functionality
- **Mobile-First:** Responsive design optimized for mobile devices
- **Card-Based Layout:** Survey and redemption options displayed as cards
- **Prominent Points Display:** Current point balance clearly visible throughout the app
- **Activity Feed:** Chronological list of user activities and transactions
- **Graceful Empty States:** All list views (e.g., surveys, offers, activity logs) must display a friendly message when no data is available, rather than an error. This ensures a positive user experience even when the database is empty.

### Collapsible Left Navigation (Sidebar)
- **Sidebar Visibility:**
  - The left navigation (sidebar) is visible for all logged-in users (panelists and admins).
  - The sidebar is collapsible: it can be expanded or collapsed by the user.
  - When expanded, clicking anywhere outside the sidebar (on the main content or overlay) will collapse the sidebar again.
- **Menu Options (Role-Based):**
  - **Panelist Menu:**
    - Dashboard
    - Earn
      - Surveys
      - Live Surveys
      - Panels
    - Redeem
    - Profile
  - **Admin Menu:**
    - Dashboard
    - Panelists
    - Surveys
    - Live Surveys
    - Panels
    - Rewards
- **Navigation Behavior:**
  - Menu options are clearly grouped and labeled.
  - Submenus (e.g., under "Earn") are expandable/collapsible.
  - The sidebar is accessible and keyboard-navigable.
  - Sidebar state (expanded/collapsed) is preserved during navigation.

---

## 🧱 Technical Notes

- MVP consists of UC01-UC08 for panelist functionality
- Survey admin features (UC09-UC12) required for survey management
- System admin features (UC13-UC17) for platform oversight
- Role-based access control required for all three user types
- Real-time points updates upon survey completion
- Secure authentication and authorization system

---

## 🔄 Change Log

| Date       | Agent | Note |
|------------|-------|------|
| 2025-07-28 | PO    | Initial use cases added for MVP |
| 2025-01-27 | PO    | Complete redesign for panelist app with three roles |
