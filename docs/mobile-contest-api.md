# Mobile Contest API Guide

This document provides comprehensive documentation for integrating the contest system into mobile applications (Android/iOS).

## Overview

The contest system allows panelists to join contests, compete for prizes, and view leaderboards. Contests have start/end dates, prizes (in points), and can be open to all panelists or restricted to invited participants.

## Authentication

All contest endpoints require authentication via Clerk session token, same as other mobile endpoints.

```http
Authorization: Bearer <clerk_session_token>
```

See [Mobile API Authentication](mobile-api-authentication.md) for authentication setup.

## API Endpoints

### List Available Contests

**Endpoint:** `GET /api/contests`

**Purpose:** Get list of contests available to the current panelist.

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `ended`). Default: `active`
- `limit` (optional): Number of results (default: 10)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "contests": [
    {
      "id": "contest-uuid",
      "title": "Summer Points Challenge",
      "description": "Earn the most points this summer!",
      "start_date": "2025-06-01T00:00:00Z",
      "end_date": "2025-08-31T23:59:59Z",
      "prize_points": 500,
      "status": "active",
      "invite_type": "all_panelists",
      "has_joined": false
    }
  ],
  "limit": 10,
  "offset": 0,
  "hasMore": false
}
```

**Example Request:**
```typescript
const response = await fetch('/api/contests?status=active&limit=20', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

### Get Contest Details

**Endpoint:** `GET /api/contests/[contestId]`

**Purpose:** Get detailed information about a specific contest, including participation status and leaderboard preview.

**Response:**
```json
{
  "contest": {
    "id": "contest-uuid",
    "title": "Summer Points Challenge",
    "description": "Earn the most points this summer!",
    "start_date": "2025-06-01T00:00:00Z",
    "end_date": "2025-08-31T23:59:59Z",
    "prize_points": 500,
    "status": "active",
    "invite_type": "all_panelists"
  },
  "has_joined": true,
  "participation": {
    "rank": 5,
    "points_earned": 1250
  },
  "leaderboard": [
    {
      "rank": 1,
      "points_earned": 2500,
      "panelist": {
        "users": [{ "email": "user1@example.com" }]
      }
    }
  ]
}
```

**Example Request:**
```typescript
const response = await fetch(`/api/contests/${contestId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

### Join Contest

**Endpoint:** `POST /api/contests/[contestId]/join`

**Purpose:** Join an active contest. Panelist must be invited (if contest is invite-only) or contest must be open to all.

**Request Body:** None

**Response:**
```json
{
  "participation": {
    "id": "participation-uuid",
    "contest_id": "contest-uuid",
    "panelist_id": "panelist-uuid",
    "joined_at": "2025-06-15T10:30:00Z",
    "points_earned": 0,
    "rank": null
  },
  "message": "Successfully joined contest"
}
```

**Error Responses:**
- `400`: Contest is not active or already joined
- `403`: Panelist not invited (for invite-only contests)
- `404`: Contest not found

**Example Request:**
```typescript
const response = await fetch(`/api/contests/${contestId}/join`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

### Get Contest Leaderboard

**Endpoint:** `GET /api/contests/[contestId]/leaderboard`

**Purpose:** Get the full leaderboard for a contest with rankings and points.

**Query Parameters:**
- `limit` (optional): Number of results (default: 50, max: 100)

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "points_earned": 2500,
      "joined_at": "2025-06-01T08:00:00Z",
      "panelist": {
        "users": [{ "email": "user1@example.com" }]
      }
    },
    {
      "rank": 2,
      "points_earned": 2300,
      "joined_at": "2025-06-01T09:15:00Z",
      "panelist": {
        "users": [{ "email": "user2@example.com" }]
      }
    }
  ],
  "total_participants": 150,
  "user_rank": 5,
  "user_points": 1250,
  "contest_status": "active"
}
```

**Example Request:**
```typescript
const response = await fetch(`/api/contests/${contestId}/leaderboard?limit=100`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

### Get User's Active Contests with Leaderboards

**Endpoint:** `GET /api/contests/my-active`

**Purpose:** Get all active contests the current panelist is enrolled in, including leaderboard previews and user's current position. This endpoint is optimized for dashboard/home screen displays.

**Query Parameters:** None

**Response:**
```json
{
  "contests": [
    {
      "id": "contest-uuid",
      "title": "Summer Points Challenge",
      "description": "Earn the most points this summer!",
      "start_date": "2025-06-01T00:00:00Z",
      "end_date": "2025-08-31T23:59:59Z",
      "prize_points": 500,
      "user_rank": 5,
      "user_points": 1250,
      "total_participants": 150,
      "leaderboard": [
        {
          "rank": 1,
          "points_earned": 2500,
          "panelist": {
            "users": [{ "email": "user1@example.com" }]
          }
        },
        {
          "rank": 2,
          "points_earned": 2300,
          "panelist": {
            "users": [{ "email": "user2@example.com" }]
          }
        }
      ]
    }
  ]
}
```

**Key Features:**
- Returns only active contests the user has joined
- Includes top 5 leaderboard entries for each contest
- Provides user's current rank and points (even if not in top 5)
- Automatically updates leaderboards before returning data
- Returns empty array if user has no active contests

**Example Request:**
```typescript
const response = await fetch('/api/contests/my-active', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})

const data = await response.json()
// data.contests contains array of active contests with leaderboards
```

**Use Cases:**
- Dashboard/home screen showing user's active contest standings
- Quick leaderboard previews without navigating to contest details
- Real-time updates for active contest positions

## Mobile App Integration Examples

### React Native Example

```typescript
import { useAuth } from '@clerk/clerk-react-native'

function ContestsScreen() {
  const { getToken } = useAuth()
  const [contests, setContests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContests()
  }, [])

  const fetchContests = async () => {
    try {
      const token = await getToken()
      const response = await fetch('https://your-domain.com/api/contests?status=active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setContests(data.contests)
      }
    } catch (error) {
      console.error('Error fetching contests:', error)
    } finally {
      setLoading(false)
    }
  }

  const joinContest = async (contestId: string) => {
    try {
      const token = await getToken()
      const response = await fetch(`https://your-domain.com/api/contests/${contestId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        alert('Successfully joined contest!')
        fetchContests() // Refresh list
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to join contest')
      }
    } catch (error) {
      console.error('Error joining contest:', error)
      alert('Error joining contest')
    }
  }

  // Render contests list...
}

// Dashboard example using my-active endpoint
function DashboardScreen() {
  const { getToken } = useAuth()
  const [activeContests, setActiveContests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveContests()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchActiveContests()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchActiveContests = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch('https://your-domain.com/api/contests/my-active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setActiveContests(data.contests || [])
      }
    } catch (error) {
      console.error('Error fetching active contests:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View>
      <Text>Active Contests</Text>
      {activeContests.map(contest => (
        <ContestCard key={contest.id}>
          <Text>{contest.title}</Text>
          <Text>Your Rank: #{contest.user_rank} of {contest.total_participants}</Text>
          <Text>Your Points: {contest.user_points}</Text>
          {/* Render top leaderboard entries */}
          {contest.leaderboard.map(entry => (
            <LeaderboardRow key={entry.rank} entry={entry} />
          ))}
        </ContestCard>
      ))}
    </View>
  )
}
```

### Swift Example

```swift
import Clerk

class ContestService {
    func fetchContests(status: String = "active") async throws -> [Contest] {
        guard let token = try await Clerk.shared.session?.getToken() else {
            throw AuthError.notAuthenticated
        }
        
        let url = URL(string: "https://your-domain.com/api/contests?status=\(status)")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(ContestsResponse.self, from: data)
        
        return response.contests
    }
    
    func joinContest(contestId: String) async throws {
        guard let token = try await Clerk.shared.session?.getToken() else {
            throw AuthError.notAuthenticated
        }
        
        let url = URL(string: "https://your-domain.com/api/contests/\(contestId)/join")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 201 else {
            throw ContestError.joinFailed
        }
    }
}

struct Contest: Codable {
    let id: String
    let title: String
    let description: String?
    let startDate: String
    let endDate: String
    let prizePoints: Int
    let status: String
    let inviteType: String
    let hasJoined: Bool
    
    enum CodingKeys: String, CodingKey {
        case id, title, description, status
        case startDate = "start_date"
        case endDate = "end_date"
        case prizePoints = "prize_points"
        case inviteType = "invite_type"
        case hasJoined = "has_joined"
    }
}

struct ContestsResponse: Codable {
    let contests: [Contest]
    let limit: Int
    let offset: Int
    let hasMore: Bool
}

// Active contests with leaderboards for dashboard
struct ActiveContestWithLeaderboard: Codable {
    let id: String
    let title: String
    let description: String?
    let startDate: String
    let endDate: String
    let prizePoints: Int
    let userRank: Int?
    let userPoints: Int
    let totalParticipants: Int
    let leaderboard: [LeaderboardEntry]
    
    enum CodingKeys: String, CodingKey {
        case id, title, description, leaderboard
        case startDate = "start_date"
        case endDate = "end_date"
        case prizePoints = "prize_points"
        case userRank = "user_rank"
        case userPoints = "user_points"
        case totalParticipants = "total_participants"
    }
}

struct LeaderboardEntry: Codable {
    let rank: Int?
    let pointsEarned: Int
    let panelist: PanelistInfo
    
    enum CodingKeys: String, CodingKey {
        case rank, panelist
        case pointsEarned = "points_earned"
    }
}

struct PanelistInfo: Codable {
    let users: [UserInfo]
}

struct UserInfo: Codable {
    let email: String
}

struct ActiveContestsResponse: Codable {
    let contests: [ActiveContestWithLeaderboard]
}
```

```swift
extension ContestService {
    func fetchActiveContests() async throws -> [ActiveContestWithLeaderboard] {
        guard let token = try await Clerk.shared.session?.getToken() else {
            throw AuthError.notAuthenticated
        }
        
        let url = URL(string: "https://your-domain.com/api/contests/my-active")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(ActiveContestsResponse.self, from: data)
        
        return response.contests
    }
}
```

### Kotlin Example

```kotlin
import com.clerk.clerk_android.Clerk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class Contest(
    val id: String,
    val title: String,
    val description: String?,
    @Serializable(with = String::class)
    val start_date: String,
    @Serializable(with = String::class)
    val end_date: String,
    val prize_points: Int,
    val status: String,
    @Serializable(with = String::class)
    val invite_type: String,
    val has_joined: Boolean
)

@Serializable
data class ContestsResponse(
    val contests: List<Contest>,
    val limit: Int,
    val offset: Int,
    val hasMore: Boolean
)

// Active contests with leaderboards for dashboard
@Serializable
data class ActiveContestWithLeaderboard(
    val id: String,
    val title: String,
    val description: String?,
    @Serializable(with = String::class)
    val start_date: String,
    @Serializable(with = String::class)
    val end_date: String,
    val prize_points: Int,
    val user_rank: Int?,
    val user_points: Int,
    val total_participants: Int,
    val leaderboard: List<LeaderboardEntry>
)

@Serializable
data class LeaderboardEntry(
    val rank: Int?,
    val points_earned: Int,
    val panelist: PanelistInfo
)

@Serializable
data class PanelistInfo(
    val users: List<UserInfo>
)

@Serializable
data class UserInfo(
    val email: String
)

@Serializable
data class ActiveContestsResponse(
    val contests: List<ActiveContestWithLeaderboard>
)

class ContestService {
    suspend fun fetchContests(status: String = "active"): List<Contest> = withContext(Dispatchers.IO) {
        val token = Clerk.instance.session?.getToken()
            ?: throw AuthException("Not authenticated")
        
        val url = URL("https://your-domain.com/api/contests?status=$status")
        val connection = url.openConnection() as HttpURLConnection
        connection.requestMethod = "GET"
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.setRequestProperty("Content-Type", "application/json")
        
        val response = connection.inputStream.bufferedReader().use { it.readText() }
        val data = Json.decodeFromString<ContestsResponse>(response)
        
        data.contests
    }
    
    suspend fun joinContest(contestId: String): Unit = withContext(Dispatchers.IO) {
        val token = Clerk.instance.session?.getToken()
            ?: throw AuthException("Not authenticated")
        
        val url = URL("https://your-domain.com/api/contests/$contestId/join")
        val connection = url.openConnection() as HttpURLConnection
        connection.requestMethod = "POST"
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.setRequestProperty("Content-Type", "application/json")
        
        val responseCode = connection.responseCode
        if (responseCode != 201) {
            throw ContestException("Failed to join contest")
        }
    }
    
    suspend fun fetchActiveContests(): List<ActiveContestWithLeaderboard> = withContext(Dispatchers.IO) {
        val token = Clerk.instance.session?.getToken()
            ?: throw AuthException("Not authenticated")
        
        val url = URL("https://your-domain.com/api/contests/my-active")
        val connection = url.openConnection() as HttpURLConnection
        connection.requestMethod = "GET"
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.setRequestProperty("Content-Type", "application/json")
        
        val response = connection.inputStream.bufferedReader().use { it.readText() }
        val data = Json.decodeFromString<ActiveContestsResponse>(response)
        
        data.contests
    }
}
```

## Contest Status Flow

1. **draft**: Contest created but not started (not visible to panelists)
2. **active**: Contest is running, panelists can join and earn points
3. **ended**: Contest has finished, leaderboard is final
4. **cancelled**: Contest was cancelled (rare)

## Points Calculation

- Points are calculated from the `point_ledger` table
- Only points earned **during** the contest period (between start_date and end_date) count
- Only **positive** transactions (points earned) are counted
- Points are recalculated when leaderboard is updated

## Leaderboard Ranking

- Participants are ranked by `points_earned` (descending)
- Ties are handled by giving the same rank to participants with equal points
- Rank is updated when leaderboard is refreshed (manually or when contest ends)
- User's rank and points are always available via `user_rank` and `user_points` fields, even if they're not in the displayed top N entries
- Leaderboards are automatically updated when fetching from `/api/contests/my-active` to ensure current data

## Best Practices

### 1. Dashboard Display with Active Contests

For dashboard/home screens, use the `/api/contests/my-active` endpoint to show all active contests the user is enrolled in:

```typescript
function DashboardScreen() {
  const { getToken } = useAuth()
  const [activeContests, setActiveContests] = useState([])

  useEffect(() => {
    fetchActiveContests()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchActiveContests()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchActiveContests = async () => {
    try {
      const token = await getToken()
      const response = await fetch('https://your-domain.com/api/contests/my-active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setActiveContests(data.contests)
      }
    } catch (error) {
      console.error('Error fetching active contests:', error)
    }
  }

  // Render contest cards with leaderboards...
}
```

### 2. Polling for Active Contests

For active contests, poll the leaderboard endpoint every 30-60 seconds to show real-time updates:

```typescript
useEffect(() => {
  if (contest?.status === 'active') {
    const interval = setInterval(() => {
      fetchLeaderboard()
    }, 30000) // 30 seconds
    
    return () => clearInterval(interval)
  }
}, [contest?.status])
```

### 3. Displaying User Position

Always show the user's position even if they're not in the top N leaderboard entries. The `/api/contests/my-active` and `/api/contests/[contestId]/leaderboard` endpoints provide `user_rank` and `user_points` fields:

```typescript
// Display user's position prominently
{contest.user_rank && (
  <View>
    <Text>Your Position: #{contest.user_rank} of {contest.total_participants}</Text>
    <Text>Your Points: {contest.user_points}</Text>
  </View>
)}

// Show top leaderboard
{contest.leaderboard.map(entry => (
  <LeaderboardRow 
    key={entry.rank}
    rank={entry.rank}
    points={entry.points_earned}
    email={entry.panelist.users[0]?.email}
    isCurrentUser={entry.rank === contest.user_rank}
  />
))}
```

### 4. Caching Contest Data

Cache contest list and details to reduce API calls:

```typescript
// Cache contests for 5 minutes
const CACHE_TTL = 5 * 60 * 1000
let contestsCache: { data: Contest[], timestamp: number } | null = null

const fetchContests = async () => {
  if (contestsCache && Date.now() - contestsCache.timestamp < CACHE_TTL) {
    return contestsCache.data
  }
  
  // Fetch from API...
  contestsCache = { data: contests, timestamp: Date.now() }
  return contests
}
```

### 5. Error Handling

Always handle errors gracefully:

```typescript
try {
  const response = await fetchContests()
  // Handle success
} catch (error) {
  if (error.status === 401) {
    // Re-authenticate
  } else if (error.status === 403) {
    // Show "Access denied" message
  } else {
    // Show generic error
  }
}
```

### 6. Offline Support

Cache contest data locally for offline viewing:

```typescript
// Store in local storage
localStorage.setItem('contests', JSON.stringify(contests))

// Load from cache when offline
const cachedContests = JSON.parse(localStorage.getItem('contests') || '[]')
```

## Error Codes

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Bad Request | Invalid request (e.g., contest not active, already joined) |
| 401 | Authentication required | Missing or invalid Clerk token |
| 403 | Access denied | Panelist not invited to contest |
| 404 | Not found | Contest doesn't exist |
| 500 | Internal server error | Server-side error |

## Testing

### Test with Postman/Insomnia

1. Get a Clerk session token from your mobile app
2. Use the token in the Authorization header
3. Test endpoints:
   - `GET /api/contests` - List contests
   - `GET /api/contests/my-active` - Get user's active contests with leaderboards
   - `GET /api/contests/[contestId]` - Get contest details
   - `POST /api/contests/[contestId]/join` - Join contest
   - `GET /api/contests/[contestId]/leaderboard` - Get leaderboard

### Example Test Request

```http
GET https://your-domain.com/api/contests?status=active
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

## Additional Resources

- [Mobile API Authentication](mobile-api-authentication.md) - Authentication setup
- [API Reference](api-reference.md) - Complete API documentation
- [Points System](points-system.md) - How points are earned and tracked

