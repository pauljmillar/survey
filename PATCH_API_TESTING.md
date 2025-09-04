# PATCH API Testing Guide

## Overview
The PATCH `/api/panelist/mail-packages/[packageId]` endpoint allows panelists to update their mail package details.

## API Specification

### Endpoint
```
PATCH /api/panelist/mail-packages/[packageId]
```

### Input (all fields optional)
```json
{
  "brand_name": "string",              // OPTIONAL
  "industry": "string",                // OPTIONAL  
  "company_validated": true,           // OPTIONAL
  "response_intention": "string",      // OPTIONAL
  "name_check": "string",              // OPTIONAL
  "notes": "string",                   // OPTIONAL
  "status": "pending|processing|completed|rejected", // OPTIONAL
  "is_approved": true,                 // OPTIONAL
  "processing_notes": "string"         // OPTIONAL
}
```

### Response
```json
{
  "success": true,
  "mail_package": {
    "id": "uuid",
    "panelist_id": "uuid",
    "brand_name": "Amazon",
    "industry": "E-commerce",
    "company_validated": true,
    "response_intention": "interested",
    "name_check": "verified",
    "notes": "Customer feedback",
    "status": "completed",
    "is_approved": true,
    "processing_notes": "AI analysis complete",
    "created_at": "2025-01-02T12:34:56.789Z",
    "updated_at": "2025-01-02T12:34:56.789Z"
  }
}
```

## Testing Methods

### 1. Browser Test (Recommended)
1. Navigate to `http://localhost:3000/test-upload`
2. Make sure you're logged in to the application
3. Click "Test New Package Upload" to create a mail package
4. Click "Test PATCH Mail Package" to test the PATCH API
5. View results in the "PATCH Update Result" section

### 2. Command Line Test
1. First, get a mail package ID by running the upload test in the browser
2. Run the test script:
   ```bash
   node test-patch-api.js <packageId>
   ```
3. Make sure you're logged in to the application in your browser first

### 3. iOS App Testing
1. Ensure the iOS app is using the correct endpoint: `/api/panelist/mail-packages/[packageId]`
2. Verify authentication is working (user must be logged in)
3. Test with the exact payload structure shown above

## Authentication Requirements
- User must be authenticated as a panelist
- User must own the mail package being updated
- Requires `update_mail_packages` permission

## Validation Rules
- `status` must be one of: `pending`, `processing`, `completed`, `rejected`
- All other fields are optional and accept any string/boolean value
- `updated_at` is automatically set to current timestamp

## Common Issues & Solutions

### 404 Error
- **Cause**: Mail package not found or endpoint doesn't exist
- **Solution**: Verify the package ID exists and the API route is properly implemented

### 403 Error
- **Cause**: Access denied - user doesn't own the mail package
- **Solution**: Ensure the authenticated user owns the mail package

### 401 Error
- **Cause**: Not authenticated
- **Solution**: User must be logged in to the application

### 400 Error
- **Cause**: Invalid status value
- **Solution**: Use only allowed status values: `pending`, `processing`, `completed`, `rejected`

## Database Schema
The following columns must exist in the `mail_packages` table:
- `brand_name` (TEXT)
- `industry` (TEXT)
- `company_validated` (BOOLEAN)
- `response_intention` (TEXT)
- `name_check` (TEXT)
- `notes` (TEXT)
- `status` (TEXT)
- `is_approved` (BOOLEAN)
- `processing_notes` (TEXT)

## Migration
If the `notes` column is missing, run:
```sql
ALTER TABLE mail_packages ADD COLUMN IF NOT EXISTS notes TEXT;
```

## Testing Checklist
- [ ] API endpoint exists and responds to PATCH requests
- [ ] Authentication is working
- [ ] Authorization (ownership) is enforced
- [ ] All optional fields can be updated
- [ ] Status validation works correctly
- [ ] Response format matches specification
- [ ] `updated_at` timestamp is updated
- [ ] Error handling works for invalid requests
