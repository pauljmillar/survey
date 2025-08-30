# Mobile API Authentication Guide

## Overview

The Panelist Rewards Platform uses **Clerk.dev** for authentication across all platforms (web and mobile). Mobile apps can authenticate using the same Clerk authentication system and access the point ledger API.

## Authentication Approach

### 1. Clerk Authentication Flow

Mobile apps should use Clerk's mobile SDKs to authenticate users:

- **iOS**: `@clerk/clerk-react-native` or `@clerk/clerk-swift`
- **Android**: `@clerk/clerk-react-native` or `@clerk/clerk-kotlin`
- **React Native**: `@clerk/clerk-react-native`

### 2. API Authentication

Once authenticated with Clerk, mobile apps make API calls with the Clerk session token in the Authorization header:

```http
GET /api/panelist/point-ledger
Authorization: Bearer <clerk_session_token>
Content-Type: application/json
```

### 3. User Identification

The API uses the Clerk user ID to identify the panelist and ensure they can only access their own data:

```typescript
// In the API endpoint
const user = await requireAuth('view_own_profile')
// user.id contains the Clerk user ID (e.g., "user_2abc123def456")
```

## Point Ledger API for Mobile Apps

### Endpoint: `GET /api/panelist/point-ledger`

**Purpose**: Retrieve point ledger activity for the authenticated panelist.

**Authentication**: Required - Clerk session token

**Permissions**: `view_own_profile` (panelists, survey admins, system admins)

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 50 | Number of records to return (max 100) |
| `offset` | integer | No | 0 | Number of records to skip for pagination |
| `transactionType` | string | No | all | Filter by transaction type |

### Transaction Types

- `survey_completion` - Points earned from completing surveys
- `manual_award` - Points awarded by admin
- `bonus` - Bonus points (signup, app download, etc.)
- `redemption` - Points spent on rewards
- `account_signup_bonus` - Welcome bonus
- `app_download_bonus` - App download bonus

### Response Format

```json
{
  "ledgerEntries": [
    {
      "points": 50,
      "transaction_type": "survey_completion",
      "title": "Survey completion: Customer Feedback Survey",
      "description": "Completed survey with 15 questions",
      "created_at": "2025-01-27T23:30:00Z"
    },
    {
      "points": -200,
      "transaction_type": "redemption",
      "title": "Redeemed: $20 Amazon Gift Card",
      "description": "Redeemed 200 points for Amazon gift card",
      "created_at": "2025-01-26T15:45:00Z"
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

### Example Mobile App Usage

#### React Native Example

```typescript
import { useAuth } from '@clerk/clerk-react-native';

const fetchPointLedger = async () => {
  const { getToken } = useAuth();
  
  try {
    const token = await getToken();
    const response = await fetch('/api/panelist/point-ledger?limit=20', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Point ledger:', data.ledgerEntries);
    }
  } catch (error) {
    console.error('Error fetching point ledger:', error);
  }
};
```

#### Swift Example

```swift
import Clerk

func fetchPointLedger() async {
    do {
        let token = try await Clerk.shared.session?.getToken()
        let url = URL(string: "https://your-domain.com/api/panelist/point-ledger?limit=20")!
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(PointLedgerResponse.self, from: data)
        
        print("Point ledger entries: \(response.ledgerEntries)")
    } catch {
        print("Error fetching point ledger: \(error)")
    }
}

// Response model
struct PointLedgerResponse: Codable {
    let ledgerEntries: [LedgerEntry]
    let pagination: PaginationInfo
}

struct LedgerEntry: Codable {
    let points: Int
    let transactionType: String
    let title: String
    let description: String?
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case points
        case transactionType = "transaction_type"
        case title
        case description
        case createdAt = "created_at"
    }
}

struct PaginationInfo: Codable {
    let limit: Int
    let offset: Int
    let total: Int
    let hasMore: Bool
}
```

#### Kotlin Example

```kotlin
import com.clerk.clerk_android.Clerk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class PointLedgerResponse(
    val ledgerEntries: List<LedgerEntry>,
    val pagination: PaginationInfo
)

@Serializable
data class LedgerEntry(
    val points: Int,
    @Serializable(with = String::class)
    val transactionType: String,
    val title: String,
    val description: String?,
    @Serializable(with = String::class)
    val createdAt: String
)

@Serializable
data class PaginationInfo(
    val limit: Int,
    val offset: Int,
    val total: Int,
    val hasMore: Boolean
)

suspend fun fetchPointLedger(): PointLedgerResponse? = withContext(Dispatchers.IO) {
    try {
        val token = Clerk.instance.session?.getToken()
        val url = URL("https://your-domain.com/api/panelist/point-ledger?limit=20")
        
        val connection = url.openConnection() as HttpURLConnection
        connection.requestMethod = "GET"
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.setRequestProperty("Content-Type", "application/json")
        
        val response = connection.inputStream.bufferedReader().use { it.readText() }
        Json.decodeFromString<PointLedgerResponse>(response)
    } catch (e: Exception) {
        println("Error fetching point ledger: $e")
        null
    }
}
```

## Security Features

### 1. Row Level Security (RLS)

The database enforces that users can only access their own data:

```sql
-- Policy: Panelists can view their own ledger entries
CREATE POLICY "Panelists can view own ledger" ON point_ledger
  FOR SELECT USING (auth.uid()::text = panelist_id);
```

### 2. Permission-Based Access

The API checks user permissions before allowing access:

```typescript
const user = await requireAuth('view_own_profile')
```

### 3. Rate Limiting

API endpoints are rate-limited to prevent abuse:

- General API: 100 requests per 15 minutes
- Authentication: 20 requests per 15 minutes

## Error Handling

### Common Error Responses

| Status Code | Error | Description |
|-------------|-------|-------------|
| 401 | `Authentication required` | Missing or invalid Clerk token |
| 403 | `Insufficient permissions` | User doesn't have required permission |
| 400 | `Limit cannot exceed 100` | Requested limit is too high |
| 500 | `Internal server error` | Server-side error |

### Error Response Format

```json
{
  "error": "Authentication required"
}
```

## Best Practices for Mobile Apps

### 1. Token Management

- Store Clerk session tokens securely
- Refresh tokens before they expire
- Handle token refresh errors gracefully

### 2. Pagination

- Use pagination for large datasets
- Implement infinite scrolling or "load more" functionality
- Cache previous results to improve performance

### 3. Error Handling

- Implement retry logic for network errors
- Show user-friendly error messages
- Log errors for debugging

### 4. Offline Support

- Cache point ledger data locally
- Sync when connection is restored
- Show offline indicators

## Testing

### Test with Postman/Insomnia

1. Get a Clerk session token from your mobile app
2. Use the token in the Authorization header
3. Test the API endpoint: `GET /api/panelist/point-ledger`

### Example Test Request

```http
GET https://your-domain.com/api/panelist/point-ledger?limit=10
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

## Integration Checklist

- [ ] Implement Clerk authentication in mobile app
- [ ] Handle token refresh and expiration
- [ ] Implement API error handling
- [ ] Add pagination for large datasets
- [ ] Test with real user accounts
- [ ] Implement offline caching (optional)
- [ ] Add loading states and error messages
- [ ] Test on different network conditions
