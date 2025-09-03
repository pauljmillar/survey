# Upload API Update Summary

## Overview
Updated the `/api/panelist/mail-scans/upload` endpoint to make `mail_package_id` optional and implement conditional logic for creating new mail packages vs. using existing ones.

## Changes Made

### 1. API Behavior Changes
- **Before**: `mail_package_id` was required and always used existing packages
- **After**: `mail_package_id` is optional and determines behavior:
  - `null` or `undefined`: Creates a new mail package + mail_scan/mail_package_document
  - Valid UUID: Uses existing mail package + creates mail_scan/mail_package_document only

### 2. Request Schema
The API now accepts the following request format:

```json
{
  "mail_package_id": "uuid|null",    // OPTIONAL - null creates new package, uuid uses existing
  "document_type": "scan|ocr_text|supporting_document|metadata", // REQUIRED
  "file_data": "base64_string",      // REQUIRED
  "filename": "string",              // REQUIRED
  "image_sequence": 1,               // REQUIRED if document_type="scan"
  "mime_type": "string",             // OPTIONAL
  "metadata": {}                     // OPTIONAL
}
```

### 3. Implementation Details

#### New Mail Package Creation (when mail_package_id is null)
- Creates new `mail_packages` record with:
  - `panelist_id`: Current user's panelist profile ID
  - `package_name`: Auto-generated name with current date
  - `status`: "pending"
- Creates `mail_scan` or `mail_package_document` record
- Returns response with new package information

#### Existing Mail Package Usage (when mail_package_id is provided)
- Verifies the mail package exists and belongs to the current user
- Creates `mail_scan` or `mail_package_document` record
- Does NOT create new mail package
- Returns response without package creation info

### 4. Response Format

#### New Package Created
```json
{
  "success": true,
  "upload_type": "scan|document",
  "scan|document": { /* record details */ },
  "mail_package": {
    "id": "uuid",
    "panelist_id": "uuid",
    "status": "pending"
  },
  "message": "New mail package created and file uploaded successfully"
}
```

#### Existing Package Used
```json
{
  "success": true,
  "upload_type": "scan|document",
  "scan|document": { /* record details */ },
  "message": "File uploaded successfully"
}
```

### 5. Database Operations

#### When Creating New Package
1. Insert into `mail_packages` table
2. Upload file to S3
3. Insert into `mail_scans` or `mail_package_documents` table
4. Return success with package info

#### When Using Existing Package
1. Verify package exists and belongs to user
2. Upload file to S3
3. Insert into `mail_scans` or `mail_package_documents` table
4. Return success without package info

### 6. Error Handling
- **400**: Invalid input validation
- **403**: Insufficient permissions
- **404**: Panelist profile not found or mail package not found/access denied
- **500**: Internal server errors (S3 upload failure, database errors)

### 7. Security
- Maintains existing authentication requirements (`upload_mail_scans` permission)
- Validates user ownership of existing mail packages
- Uses service role for database operations (bypasses RLS for admin functions)

### 8. Testing
A test script (`test-upload-api.js`) has been created to verify both scenarios:
- Creating new mail packages
- Using existing mail packages

## Usage Examples

### Create New Mail Package
```javascript
const response = await fetch('/api/panelist/mail-scans/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mail_package_id: null,  // Will create new package
    document_type: "scan",
    file_data: "base64_encoded_file",
    filename: "mail_scan_1.jpg",
    image_sequence: 1
  })
});
```

### Use Existing Mail Package
```javascript
const response = await fetch('/api/panelist/mail-scans/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mail_package_id: "existing-uuid-here",  // Will use existing package
    document_type: "supporting_document",
    file_data: "base64_encoded_file",
    filename: "receipt.pdf"
  })
});
```

## Backward Compatibility
- Existing clients sending `mail_package_id` will continue to work unchanged
- New clients can omit `mail_package_id` to create new packages
- All existing validation and error handling remains intact

## Files Modified
- `app/api/panelist/mail-scans/upload/route.ts` - Main API implementation
- `test-upload-api.js` - Test script for verification
- `UPLOAD_API_UPDATE_SUMMARY.md` - This documentation
