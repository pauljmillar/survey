# API Routes and Services

This directory contains all API routes for the Panelist Rewards Platform. The API provides secure, role-based access to all platform functionality with comprehensive error handling, validation, and rate limiting.

## Architecture

- **Authentication**: All routes use Clerk.dev integration with role-based permissions
- **Database**: Supabase PostgreSQL with Row Level Security
- **Validation**: Zod schemas for request/response validation
- **Rate Limiting**: Built-in rate limiting for security and performance
- **Error Handling**: Standardized error responses with proper HTTP status codes

## API Endpoints

### Authentication (`/api/auth/`)

#### `/api/auth/user-role`
- **GET**: Get current user's role and profile info
- **PUT**: Update user role (system admin only)

#### `/api/auth/panelist-profile`
- **GET**: Get panelist profile data
- **POST**: Create new panelist profile
- **PUT**: Update panelist profile data

### Surveys (`/api/surveys/`)

#### `/api/surveys`
- **GET**: List surveys (filtered by role and permissions)
- **POST**: Create new survey (survey admin+)
- **PUT**: Update survey (owner or system admin)
- **DELETE**: Delete survey (owner or system admin)

**Query Parameters:**
- `status`: Filter by survey status (draft/active/inactive)
- `limit`: Number of results (default: 10, max: 100)
- `offset`: Pagination offset
- `page`: Page number (alternative to offset)

#### `/api/surveys/available`
- **GET**: Get available surveys for current panelist
  - Only shows active surveys the panelist is qualified for
  - Excludes already completed surveys

#### `/api/surveys/complete`
- **POST**: Complete a survey and award points
  - Validates qualification and survey status
  - Awards points using database transaction
  - Prevents duplicate completions

### Points (`/api/points/`)

#### `/api/points/balance`
- **GET**: Get current points balance and totals
  - Returns balance, total earned, total redeemed
  - Panelists only see their own balance

### Redemptions (`/api/redemptions/`)

#### `/api/redemptions`
- **GET**: List user's redemption history
- **POST**: Redeem points for an offer
  - Validates sufficient balance
  - Creates redemption record
  - Deducts points using database transaction

**Query Parameters:**
- `status`: Filter by redemption status
- `limit`: Number of results
- `offset`: Pagination offset

### Offers (`/api/offers/`)

#### `/api/offers`
- **GET**: List available merchant offers (public access)
- **POST**: Create new offer (system admin only)
- **PUT**: Update offer (system admin only)
- **DELETE**: Delete offer (system admin only)

**Query Parameters:**
- `active`: Filter by active status (default: true)
- `min_points`: Minimum points required
- `max_points`: Maximum points required
- `limit`: Number of results
- `offset`: Pagination offset

### Qualifications (`/api/qualifications/`)

#### `/api/qualifications`
- **GET**: List survey qualifications
- **POST**: Update qualifications (single or bulk)

**Query Parameters:**
- `survey_id`: Required - Survey to manage qualifications for
- `panelist_id`: Optional - Specific panelist
- `limit`: Number of results
- `offset`: Pagination offset

### Activity (`/api/activity/`)

#### `/api/activity`
- **GET**: Get activity log
  - Users see their own activity
  - System admins can view any user's activity

**Query Parameters:**
- `type`: Filter by activity type
- `user_id`: User to view (system admin only)
- `limit`: Number of results
- `offset`: Pagination offset

## Authentication & Authorization

### Permission Matrix

| Permission | Panelist | Survey Admin | System Admin |
|------------|----------|--------------|--------------|
| view_own_profile | ✅ | ✅ | ✅ |
| complete_surveys | ✅ | ❌ | ❌ |
| redeem_points | ✅ | ❌ | ❌ |
| create_surveys | ❌ | ✅ | ✅ |
| manage_qualifications | ❌ | ✅ | ✅ |
| view_survey_analytics | ❌ | ✅ | ✅ |
| view_all_users | ❌ | ❌ | ✅ |
| manage_offers | ❌ | ❌ | ✅ |
| manage_user_accounts | ❌ | ❌ | ✅ |
| view_platform_analytics | ❌ | ❌ | ✅ |

### Role Hierarchy
1. **Panelist** - Can complete surveys and redeem points
2. **Survey Admin** - Can create/manage surveys and qualifications
3. **System Admin** - Full platform access

## Rate Limiting

Different endpoints have different rate limits for security:

- **General API**: 100 requests per 15 minutes
- **Authentication**: 20 requests per 15 minutes
- **Survey Completion**: 5 requests per minute
- **Redemptions**: 3 requests per minute
- **Admin Operations**: 50 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Time when window resets

## Error Handling

### Standard Error Responses

```json
{
  "error": "Error message",
  "details": { /* Optional additional details */ }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Rate Limited
- `500` - Internal Server Error

### Validation Errors

Validation errors include detailed field-level feedback:

```json
{
  "error": "Validation error",
  "details": {
    "fieldErrors": {
      "title": ["Title is required"],
      "points_reward": ["Must be a positive number"]
    }
  }
}
```

## Request/Response Examples

### Create Survey

**Request:**
```http
POST /api/surveys
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Customer Feedback Survey",
  "description": "Help us improve our service",
  "points_reward": 50,
  "estimated_completion_time": 10,
  "qualification_criteria": {
    "min_age": 18,
    "locations": ["US", "CA"]
  },
  "status": "draft"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Customer Feedback Survey",
  "description": "Help us improve our service",
  "points_reward": 50,
  "estimated_completion_time": 10,
  "qualification_criteria": {
    "min_age": 18,
    "locations": ["US", "CA"]
  },
  "status": "draft",
  "created_by": "user_123",
  "created_at": "2025-01-27T23:30:00Z",
  "updated_at": "2025-01-27T23:30:00Z"
}
```

### Complete Survey

**Request:**
```http
POST /api/surveys/complete
Content-Type: application/json
Authorization: Bearer <token>

{
  "survey_id": "123e4567-e89b-12d3-a456-426614174000",
  "response_data": {
    "satisfaction": 8,
    "comments": "Great service!"
  }
}
```

**Response:**
```json
{
  "success": true,
  "completion_id": "456e7890-e89b-12d3-a456-426614174001",
  "points_earned": 50,
  "new_balance": 350,
  "total_earned": 1200
}
```

### Redeem Points

**Request:**
```http
POST /api/redemptions
Content-Type: application/json
Authorization: Bearer <token>

{
  "offer_id": "789e0123-e89b-12d3-a456-426614174002"
}
```

**Response:**
```json
{
  "success": true,
  "redemption_id": "012e3456-e89b-12d3-a456-426614174003",
  "points_spent": 200,
  "new_balance": 150,
  "total_redeemed": 500
}
```

## Security Features

1. **Authentication**: Clerk.dev integration with secure session management
2. **Authorization**: Role-based permissions on all endpoints
3. **Input Validation**: Zod schemas prevent malicious input
4. **Rate Limiting**: Prevents abuse and ensures fair usage
5. **CORS**: Configured for secure cross-origin requests
6. **XSS Protection**: Security headers and input sanitization
7. **SQL Injection**: Protection via Supabase client and parameterized queries

## Testing

### API Testing Strategy

1. **Unit Tests**: Individual endpoint validation
2. **Integration Tests**: End-to-end user flows
3. **Security Tests**: Permission and rate limit validation
4. **Performance Tests**: Load testing for high-traffic scenarios

### Test Coverage Areas

- Authentication and authorization
- Input validation and error handling
- Rate limiting functionality
- Database transaction integrity
- Points awarding and redemption logic
- Survey completion workflow

## Monitoring

### Key Metrics to Monitor

- **Response Times**: Track API performance
- **Error Rates**: Monitor 4xx and 5xx responses
- **Rate Limit Hits**: Track abuse patterns
- **Database Performance**: Query execution times
- **Authentication Failures**: Security monitoring

### Logging

All API requests are logged with:
- Timestamp and duration
- HTTP method and path
- User ID and role
- Response status
- Error details (when applicable)

## Development Guidelines

### Adding New Endpoints

1. **Create Route File**: Add to appropriate `/api/` directory
2. **Add Authentication**: Use `requireAuth()` with proper permission
3. **Add Validation**: Create Zod schemas for request/response
4. **Add Rate Limiting**: Apply appropriate rate limits
5. **Add Error Handling**: Use standard error utilities
6. **Add Tests**: Unit and integration tests
7. **Update Documentation**: Add to this README

### Best Practices

- Always validate input with Zod schemas
- Use database transactions for multi-step operations
- Log all significant operations for audit trail
- Return consistent error response formats
- Include rate limit headers in responses
- Use TypeScript for type safety
- Follow RESTful conventions

## Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Future Enhancements

- **Redis Integration**: Replace in-memory rate limiting with Redis
- **API Versioning**: Add versioning support for backward compatibility
- **GraphQL**: Consider GraphQL endpoint for complex queries
- **Webhooks**: Add webhook support for external integrations
- **Caching**: Implement response caching for performance
- **Analytics**: Enhanced API usage analytics
- **Documentation**: Auto-generated API documentation with OpenAPI/Swagger 