# API Reference

This document provides an overview of the PanelPro API. For detailed endpoint documentation, see [app/api/README.md](../app/api/README.md).

## Base URL

All API endpoints are relative to the base URL:
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

## Authentication

All API endpoints (except public endpoints) require authentication via Clerk session token.

### Authentication Header

```http
Authorization: Bearer <clerk_session_token>
```

### Getting a Session Token

**Web App**: Automatically handled by Clerk middleware

**Mobile App**: Use Clerk mobile SDK to get session token:
```typescript
const token = await clerk.session?.getToken();
```

See [Mobile API Authentication](mobile-api-authentication.md) for mobile integration details.

## API Structure

### Endpoint Groups

- `/api/auth/*` - Authentication and user management
- `/api/surveys/*` - Survey operations
- `/api/panelist/*` - Panelist-specific endpoints
- `/api/admin/*` - Admin endpoints
- `/api/points/*` - Points balance and history
- `/api/offers/*` - Merchant offers
- `/api/redemptions/*` - Redemption operations
- `/api/activity/*` - Activity logs
- `/api/contests/*` - Contest operations
- `/api/webhooks/*` - Webhook handlers

## Common Patterns

### Request Format

Most POST/PUT/PATCH requests use JSON:

```http
Content-Type: application/json
```

### Response Format

**Success Response:**
```json
{
  "data": { ... },
  "message": "Success message"
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": { ... }
}
```

### Pagination

Many list endpoints support pagination:

**Query Parameters:**
- `limit` - Number of results (default: 10, max: 100)
- `offset` - Number of records to skip
- `page` - Page number (alternative to offset)

**Response:**
```json
{
  "data": [ ... ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 100,
    "hasMore": true
  }
}
```

## Authentication Endpoints

### Get User Role
```
GET /api/auth/user-role
```

Returns current user's role and profile information.

**Response:**
```json
{
  "role": "panelist",
  "userId": "user_123",
  "email": "user@example.com"
}
```

### Get Panelist Profile
```
GET /api/auth/panelist-profile
```

Returns panelist profile data.

### Create Panelist Profile
```
POST /api/auth/panelist-profile
```

Creates a new panelist profile (used during registration).

**Request Body:**
```json
{
  "profile_data": {
    "age": 30,
    "gender": "male",
    "location": {
      "country": "US",
      "state": "CA",
      "city": "San Francisco"
    },
    "interests": ["technology", "sports"]
  }
}
```

## Survey Endpoints

### List Surveys
```
GET /api/surveys
```

List all surveys (filtered by role and permissions).

**Query Parameters:**
- `status` - Filter by status (draft/active/inactive)
- `limit` - Number of results
- `offset` - Pagination offset

### Get Available Surveys
```
GET /api/surveys/available
```

Get surveys available to the current panelist (qualified and not completed).

### Complete Survey
```
POST /api/surveys/complete
```

Complete a survey and earn points.

**Request Body:**
```json
{
  "survey_id": "survey_123",
  "response_data": {
    "answers": { ... }
  }
}
```

**Response:**
```json
{
  "success": true,
  "points_earned": 50,
  "new_balance": 350
}
```

## Panelist Endpoints

### Get Point Ledger
```
GET /api/panelist/point-ledger
```

Get point transaction history for the authenticated panelist.

**Query Parameters:**
- `limit` - Number of records (default: 50, max: 100)
- `offset` - Pagination offset
- `transactionType` - Filter by transaction type

**Response:**
```json
{
  "ledgerEntries": [
    {
      "points": 50,
      "transaction_type": "survey_completion",
      "title": "Survey completion: Customer Feedback",
      "description": "Completed survey with 15 questions",
      "created_at": "2025-01-27T23:30:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 125,
    "hasMore": true
  }
}
```

### Get Mail Packages
```
GET /api/panelist/mail-packages
```

List all mail packages for the authenticated panelist.

### Upload Mail Scans
```
POST /api/panelist/mail-scans/upload
```

Upload images for a mail package. Returns presigned URLs for S3 upload.

**Request Body:**
```json
{
  "package_name": "January Mail",
  "images": [
    {
      "filename": "mail1.jpg",
      "content_type": "image/jpeg"
    }
  ]
}
```

## Points Endpoints

### Get Points Balance
```
GET /api/points/balance
```

Get current points balance and totals.

**Response:**
```json
{
  "balance": 350,
  "total_earned": 1200,
  "total_redeemed": 850
}
```

## Offers Endpoints

### List Offers
```
GET /api/offers
```

List available merchant offers.

**Query Parameters:**
- `active` - Filter by active status (default: true)
- `min_points` - Minimum points required
- `max_points` - Maximum points required

### Get Offer
```
GET /api/offers/[offerId]
```

Get details of a specific offer.

## Redemption Endpoints

### List Redemptions
```
GET /api/redemptions
```

List user's redemption history.

**Query Parameters:**
- `status` - Filter by status
- `limit` - Number of results
- `offset` - Pagination offset

### Redeem Points
```
POST /api/redemptions
```

Redeem points for an offer.

**Request Body:**
```json
{
  "offer_id": "offer_123"
}
```

**Response:**
```json
{
  "success": true,
  "redemption_id": "redemption_456",
  "points_spent": 200,
  "new_balance": 150
}
```

## Admin Endpoints

### List Panelists
```
GET /api/admin/panelists
```

List all panelists (system admin only).

### List Mail Packages
```
GET /api/admin/mail-packages
```

List all mail packages for admin review.

### Update Mail Package
```
PATCH /api/admin/mail-packages/[packageId]
```

Update mail package status and add review notes.

**Request Body:**
```json
{
  "status": "completed",
  "processing_notes": "Approved - valid marketing mail"
}
```

### Award Points
```
POST /api/admin/point-ledger
```

Manually award points to a panelist (system admin only).

**Request Body:**
```json
{
  "panelist_id": "user_123",
  "points": 100,
  "title": "Bonus for participation",
  "description": "Special bonus",
  "transaction_type": "manual_award"
}
```

## Activity Endpoints

### Get Activity Log
```
GET /api/activity
```

Get activity log for the authenticated user.

**Query Parameters:**
- `type` - Filter by activity type
- `user_id` - User to view (system admin only)
- `limit` - Number of results
- `offset` - Pagination offset

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Rate Limited
- `500` - Internal Server Error

### Error Response Format

```json
{
  "error": "Error message",
  "details": {
    "fieldErrors": {
      "field_name": ["Error message"]
    }
  }
}
```

### Common Errors

**Authentication Required:**
```json
{
  "error": "Authentication required"
}
```

**Insufficient Permissions:**
```json
{
  "error": "Insufficient permissions"
}
```

**Validation Error:**
```json
{
  "error": "Validation error",
  "details": {
    "fieldErrors": {
      "points_reward": ["Must be a positive number"]
    }
  }
}
```

## Rate Limiting

Different endpoints have different rate limits:

- **General API**: 100 requests per 15 minutes
- **Authentication**: 20 requests per 15 minutes
- **Survey Completion**: 5 requests per minute
- **Redemptions**: 3 requests per minute
- **Admin Operations**: 50 requests per minute

### Rate Limit Headers

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded

When rate limit is exceeded:

**Status Code:** `429`

**Response:**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

## Webhooks

### Clerk Webhook

```
POST /api/webhooks/clerk
```

Handles Clerk user creation/update events to sync user data.

**Headers:**
```
svix-id: <webhook_id>
svix-timestamp: <timestamp>
svix-signature: <signature>
```

See [CLERK_WEBHOOK_SETUP.md](../CLERK_WEBHOOK_SETUP.md) for setup details.

## Testing

### Using Postman/Insomnia

1. Get a Clerk session token from your app
2. Set `Authorization: Bearer <token>` header
3. Make API requests

### Example Request

```http
GET /api/points/balance
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

## Best Practices

### Error Handling

- Always check response status codes
- Handle rate limit errors with retry logic
- Display user-friendly error messages
- Log errors for debugging

### Caching

- Cache static data (offers, surveys)
- Use ETags for conditional requests
- Implement client-side caching

### Pagination

- Always use pagination for large datasets
- Implement "load more" or infinite scroll
- Cache previous pages

### Security

- Never expose session tokens in client code
- Use HTTPS in production
- Validate all user input
- Sanitize error messages

## Contest Endpoints

### List Contests
```
GET /api/contests
```
List contests available to the current panelist.

**Query Parameters:**
- `status` - Filter by status (active, ended)
- `limit` - Number of results
- `offset` - Pagination offset

### Get Contest Details
```
GET /api/contests/[contestId]
```
Get contest details with participation status and leaderboard preview.

### Join Contest
```
POST /api/contests/[contestId]/join
```
Join an active contest.

### Get Leaderboard
```
GET /api/contests/[contestId]/leaderboard
```
Get full leaderboard for a contest.

**Query Parameters:**
- `limit` - Number of results (default: 50, max: 100)

See [Mobile Contest API](mobile-contest-api.md) for detailed mobile integration guide.

## Additional Resources

- [Detailed API Documentation](../app/api/README.md) - Complete endpoint reference
- [Mobile API Authentication](mobile-api-authentication.md) - Mobile app integration
- [Mobile Contest API](mobile-contest-api.md) - Contest system for mobile apps
- [Architecture Overview](architecture.md) - System architecture
- [Setup Guide](setup-guide.md) - Development setup

