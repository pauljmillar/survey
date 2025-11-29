# Points System

The points system is the core reward mechanism in PanelPro. This document explains how points are earned, tracked, and managed.

## Overview

Panelists earn points through various activities and can redeem them for rewards. All point transactions are tracked in a comprehensive ledger system that maintains a complete audit trail.

## Point Ledger

### Ledger Table

The `point_ledger` table is the source of truth for all point transactions:

```sql
point_ledger (
  id UUID PRIMARY KEY,
  panelist_id TEXT REFERENCES users(id),
  points INTEGER NOT NULL, -- Positive for awards, negative for redemptions
  balance_after INTEGER NOT NULL, -- Running balance after this transaction
  transaction_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  awarded_by TEXT REFERENCES users(id), -- NULL for system-awarded
  created_at TIMESTAMP,
  effective_date DATE DEFAULT CURRENT_DATE
)
```

### Key Features

- **Immutable**: Once created, ledger entries cannot be modified
- **Complete History**: Every point transaction is recorded
- **Running Balance**: Each entry includes the balance after that transaction
- **Metadata**: Flexible JSONB field for additional transaction data
- **Audit Trail**: Tracks who awarded points (for manual adjustments)

## Transaction Types

### Earning Points

| Transaction Type | Description | Points | Trigger |
|-----------------|-------------|--------|---------|
| `survey_completion` | Completed a survey | Variable | Survey completion API |
| `mail_package_scan` | Created a mail package | 5 | Mail package insert trigger |
| `mail_pack_review` | Mail package completed | 5 | Mail package status update trigger |
| `account_signup_bonus` | Account signup bonus | Variable | Profile creation trigger |
| `app_download_bonus` | Mobile app download | Variable | Manual or API |
| `manual_award` | Admin manual award | Variable | Admin API |
| `system_adjustment` | System adjustment | Variable | System process |

### Spending Points

| Transaction Type | Description | Points | Trigger |
|-----------------|-------------|--------|---------|
| `redemption` | Redeemed for offer | Negative | Redemption API |

## Points Balance

### Balance Calculation

The current balance is calculated from the point ledger:

```sql
SELECT COALESCE(balance_after, 0)
FROM point_ledger
WHERE panelist_id = ?
ORDER BY created_at DESC, id DESC
LIMIT 1;
```

### Balance Synchronization

The `panelist_profiles.points_balance` field is kept in sync with the ledger via database triggers:

```sql
-- Trigger updates panelist_profiles when ledger entry is created
CREATE TRIGGER trigger_update_panelist_balance
  AFTER INSERT ON point_ledger
  FOR EACH ROW
  EXECUTE FUNCTION update_panelist_balance_from_ledger();
```

### Balance Fields

The `panelist_profiles` table maintains:
- `points_balance` - Current available balance
- `total_points_earned` - Lifetime points earned (sum of positive transactions)
- `total_points_redeemed` - Lifetime points redeemed (sum of negative transactions)

## Database Functions

### Award Points

```sql
award_points(
  p_panelist_id TEXT,
  p_points INTEGER,
  p_transaction_type TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_awarded_by TEXT DEFAULT NULL,
  p_effective_date DATE DEFAULT CURRENT_DATE
) RETURNS UUID
```

**Usage Example:**
```sql
SELECT award_points(
  'user_123',
  50,
  'survey_completion',
  'Survey completion: Customer Feedback',
  'Completed survey with 15 questions',
  '{"survey_id": "survey_456"}'::jsonb,
  NULL, -- System-awarded
  CURRENT_DATE
);
```

### Redeem Points

```sql
redeem_points(
  p_panelist_id TEXT,
  p_points INTEGER,
  p_title TEXT,
  p_transaction_type TEXT DEFAULT 'redemption',
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_effective_date DATE DEFAULT CURRENT_DATE
) RETURNS UUID
```

**Usage Example:**
```sql
SELECT redeem_points(
  'user_123',
  200,
  'Redeemed: $20 Amazon Gift Card',
  'redemption',
  'Redeemed 200 points for Amazon gift card',
  '{"offer_id": "offer_789"}'::jsonb,
  CURRENT_DATE
);
```

### Get Balance

```sql
get_panelist_balance(p_panelist_id TEXT) RETURNS INTEGER
```

**Usage Example:**
```sql
SELECT get_panelist_balance('user_123');
-- Returns: 350
```

## Automated Bonuses

### Account Signup Bonus

**Trigger**: When a `panelist_profiles` record is created

**Implementation**:
```sql
CREATE TRIGGER trigger_account_signup_bonus
  AFTER INSERT ON panelist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_account_signup_bonus();
```

**Points**: Configurable (typically 50-100 points)

**Transaction Type**: `account_signup_bonus`

### App Download Bonus

**Trigger**: When mobile app is installed (via API)

**Points**: Configurable (typically 25-50 points)

**Transaction Type**: `app_download_bonus`

### Mail Scanning Bonuses

See [Mail Scanning System](mail-scanning-system.md) for details on mail scanning points.

## Manual Point Adjustments

### Admin Award Points

System admins can manually award points via API:

```
POST /api/admin/point-ledger
{
  "panelist_id": "user_123",
  "points": 100,
  "title": "Bonus for participation",
  "description": "Special bonus for active participation",
  "transaction_type": "manual_award"
}
```

### System Adjustments

System processes can create adjustments:

```sql
SELECT award_points(
  'user_123',
  50,
  'system_adjustment',
  'Balance correction',
  'Corrected balance discrepancy',
  '{"reason": "correction", "reference": "ticket_456"}'::jsonb,
  NULL
);
```

## Redemption Process

### Redemption Flow

1. Panelist selects offer to redeem
2. System validates sufficient balance
3. Points are redeemed via `redeem_points()` function
4. Redemption record created in `redemptions` table
5. Points deducted from balance
6. Transaction logged in point ledger

### Insufficient Balance

If balance is insufficient:
- Redemption is rejected
- Error message returned
- No transaction created
- Balance remains unchanged

## Point Ledger Queries

### Get Ledger for Panelist

```sql
SELECT 
  points,
  balance_after,
  transaction_type,
  title,
  description,
  created_at
FROM point_ledger
WHERE panelist_id = 'user_123'
ORDER BY created_at DESC
LIMIT 50;
```

### Filter by Transaction Type

```sql
SELECT *
FROM point_ledger
WHERE panelist_id = 'user_123'
  AND transaction_type = 'survey_completion'
ORDER BY created_at DESC;
```

### Get Points Earned (Lifetime)

```sql
SELECT COALESCE(SUM(points), 0) as total_earned
FROM point_ledger
WHERE panelist_id = 'user_123'
  AND points > 0;
```

### Get Points Redeemed (Lifetime)

```sql
SELECT COALESCE(SUM(ABS(points)), 0) as total_redeemed
FROM point_ledger
WHERE panelist_id = 'user_123'
  AND points < 0;
```

## API Endpoints

### Panelist Endpoints

#### Get Point Ledger
```
GET /api/panelist/point-ledger
```

Query parameters:
- `limit` - Number of records (default: 50, max: 100)
- `offset` - Pagination offset
- `transactionType` - Filter by transaction type

#### Get Points Balance
```
GET /api/points/balance
```

Returns:
- Current balance
- Total points earned
- Total points redeemed

### Admin Endpoints

#### Get All Ledger Entries
```
GET /api/admin/point-ledger
```

Query parameters:
- `panelist_id` - Filter by panelist
- `transaction_type` - Filter by type
- `limit`, `offset` - Pagination

#### Award Points Manually
```
POST /api/admin/point-ledger
{
  "panelist_id": "user_123",
  "points": 100,
  "title": "Bonus",
  "description": "Special bonus",
  "transaction_type": "manual_award"
}
```

## Validation Rules

### Point Values

- Points must be non-zero
- Positive values for awards
- Negative values for redemptions
- Balance cannot go negative (enforced in `redeem_points()`)

### Transaction Types

Valid transaction types (enforced by constraint):
- `survey_completion`
- `redemption`
- `manual_award`
- `system_adjustment`
- `account_signup_bonus`
- `app_download_bonus`
- `mail_package_scan`
- `mail_pack_review`

## Performance Considerations

### Indexes

Key indexes for performance:
```sql
CREATE INDEX idx_point_ledger_panelist_id ON point_ledger(panelist_id);
CREATE INDEX idx_point_ledger_created_at ON point_ledger(created_at);
CREATE INDEX idx_point_ledger_transaction_type ON point_ledger(transaction_type);
CREATE INDEX idx_point_ledger_panelist_created ON point_ledger(panelist_id, created_at DESC);
```

### Balance Calculation

- Balance is calculated from ledger (source of truth)
- `panelist_profiles.points_balance` is cached for performance
- Trigger keeps cache in sync
- For critical operations, always calculate from ledger

## Audit Trail

### Complete History

Every point transaction is permanently recorded:
- Who earned/spent points
- When the transaction occurred
- What activity triggered it
- Who awarded it (for manual adjustments)
- Metadata about the transaction

### Reporting

The ledger enables:
- Financial reporting
- Activity analysis
- Fraud detection
- Dispute resolution
- Tax reporting (if needed)

## Security

### Access Control

- Panelists can only view their own ledger
- Admins can view all ledgers
- Database RLS policies enforce access

### Immutability

- Ledger entries cannot be modified
- Corrections create new entries
- Deletions are not allowed (for audit)

### Validation

- All transactions validated before creation
- Balance checks prevent negative balances
- Transaction types validated against constraint

## Troubleshooting

### Balance Discrepancies

If balance doesn't match ledger:
1. Check trigger is active: `trigger_update_panelist_balance`
2. Recalculate balance from ledger
3. Sync `panelist_profiles.points_balance` if needed

### Missing Transactions

If points not awarded:
1. Check database triggers are active
2. Verify function calls succeeded
3. Check point_ledger for transaction records
4. Review error logs

### Performance Issues

If ledger queries are slow:
1. Verify indexes exist
2. Check query plans
3. Consider pagination
4. Review transaction volume

## Future Enhancements

Planned improvements:

- **Point Expiration**: Points expire after set time
- **Tiered Rewards**: Different point values by tier
- **Referral Bonuses**: Points for referring panelists
- **Bonus Multipliers**: Special event multipliers
- **Point Transfers**: Transfer points between accounts
- **Point History Export**: Export ledger for reporting

