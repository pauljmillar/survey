# Mail Scanning System

The mail scanning system allows panelists to earn points by scanning marketing mail offers they receive. This document explains how the system works from both panelist and admin perspectives.

## Overview

Panelists can use mobile apps (Android/iOS) to photograph marketing mail they receive and submit these images to earn points. The system processes these submissions, stores images in AWS S3, and awards points automatically.

## How It Works

### Panelist Workflow

1. **Receive Marketing Mail**: Panelist receives marketing mail (postcards, catalogs, flyers, etc.)
2. **Scan with Mobile App**: Panelist opens mobile app and takes photos of the mail
3. **Create Mail Package**: Multiple images are grouped into a "mail package"
4. **Upload Images**: Images are uploaded to AWS S3 via presigned URLs
5. **Submit Package**: Package is submitted with metadata (industry, brand, mail type)
6. **Earn Points**: Points are automatically awarded:
   - **5 points** when package is created
   - **5 points** when package status is set to "completed" (by admin or automatically)

### Admin Workflow

1. **Review Submissions**: Admins view submitted mail packages
2. **Review Images**: View individual scanned images from S3
3. **Validate Content**: Verify mail content and metadata
4. **Approve/Reject**: Set package status (pending, processing, completed, rejected)
5. **Add Notes**: Add processing notes or review comments

## Database Schema

### Mail Packages Table

The `mail_packages` table stores the main container for mail scanning submissions:

```sql
mail_packages (
  id UUID PRIMARY KEY,
  panelist_id UUID REFERENCES panelist_profiles(id),
  package_name TEXT,
  package_description TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  points_awarded INTEGER DEFAULT 0,
  industry TEXT,
  brand_name TEXT,
  company_validated BOOLEAN DEFAULT FALSE,
  response_intention TEXT,
  name_check TEXT,
  reviewed_by TEXT REFERENCES users(id),
  review_date TIMESTAMP,
  processing_notes TEXT,
  s3_key TEXT, -- First image thumbnail
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Mail Scans Table

The `mail_scans` table stores individual scanned images within a package:

```sql
mail_scans (
  id UUID PRIMARY KEY,
  panelist_id UUID REFERENCES panelist_profiles(id),
  mailpack_id UUID REFERENCES mail_packages(id),
  image_filename VARCHAR(255),
  s3_bucket_name VARCHAR(100) DEFAULT 'survey-mail-scans',
  s3_key VARCHAR(500), -- Full S3 path
  file_size_bytes BIGINT,
  image_sequence INTEGER DEFAULT 1, -- Order within package
  industry VARCHAR(100),
  mail_type VARCHAR(50), -- 'postcard', 'catalog', 'flyer', etc.
  brand_name VARCHAR(100),
  scan_status VARCHAR(20) CHECK (scan_status IN ('uploaded', 'processing', 'processed', 'flagged', 'approved', 'rejected')),
  processing_notes TEXT,
  scan_date TIMESTAMP,
  processed_date TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Scan Sessions Table

The `scan_sessions` table tracks mobile app scanning sessions for analytics:

```sql
scan_sessions (
  id UUID PRIMARY KEY,
  panelist_id UUID REFERENCES panelist_profiles(id),
  device_info JSONB,
  location_data JSONB,
  session_start TIMESTAMP,
  session_end TIMESTAMP,
  total_scans INTEGER DEFAULT 0,
  created_at TIMESTAMP
)
```

## Points System

### Points Awarded

The mail scanning system awards points automatically via database triggers:

1. **Package Creation** (5 points)
   - Triggered when a new `mail_packages` record is inserted
   - Transaction type: `mail_package_scan`
   - Title: "Mail Package Scan"
   - Description: "5 points awarded for scanning a mail package"

2. **Package Completion** (5 points)
   - Triggered when `mail_packages.status` changes to `'completed'`
   - Transaction type: `mail_pack_review`
   - Title: "Mail Package Review"
   - Description: "5 points awarded for reviewing the mail package"

### Points Calculation

- **Total per package**: 10 points (5 for scan + 5 for completion)
- **Maximum per package**: 10 points
- **No points for rejected packages**: Rejected packages don't award completion points

## File Storage

### AWS S3 Structure

Images are stored in AWS S3 with the following structure:

```
survey-mail-scans/
  {panelist_id}/
    {package_id}/
      {image_sequence}_{filename}
```

Example:
```
survey-mail-scans/
  abc123-def456/
    pkg-789-xyz/
      1_front.jpg
      2_back.jpg
```

### S3 Key Storage

- Each `mail_scans` record stores the full S3 key path
- The `mail_packages.s3_key` stores the first image's S3 key (for thumbnails)
- S3 keys are used to generate presigned URLs for secure access

### Presigned URLs

- **Upload**: Presigned POST URLs for secure image uploads
- **Download**: Presigned GET URLs for secure image viewing
- **Expiration**: URLs expire after a set time (typically 1 hour)

## API Endpoints

### Panelist Endpoints

#### Upload Mail Scans
```
POST /api/panelist/mail-scans/upload
```
Upload images for a mail package. Returns presigned URLs for S3 upload.

#### Get Mail Packages
```
GET /api/panelist/mail-packages
```
List all mail packages for the authenticated panelist.

#### Get Mail Package Details
```
GET /api/panelist/mail-packages/[packageId]
```
Get details of a specific mail package including all scans.

#### Process Mail Package
```
POST /api/panelist/mail-packages/[packageId]/process
```
Submit a mail package for review (sets status, adds metadata).

### Admin Endpoints

#### List All Mail Packages
```
GET /api/admin/mail-packages
```
List all mail packages (with filters for status, panelist, date).

#### Get Mail Package Details
```
GET /api/admin/mail-packages/[packageId]
```
Get detailed information about a mail package.

#### Update Mail Package
```
PATCH /api/admin/mail-packages/[packageId]
```
Update mail package status, add review notes, approve/reject.

#### Get S3 Image
```
GET /api/admin/s3-image/[key]
```
Get presigned URL for viewing an S3 image.

## Status Flow

### Package Statuses

1. **pending** - Package created, awaiting review
2. **processing** - Package being reviewed by admin
3. **completed** - Package approved and points awarded
4. **rejected** - Package rejected (no completion points)

### Scan Statuses

1. **uploaded** - Image uploaded to S3
2. **processing** - Image being processed/analyzed
3. **processed** - Image processed successfully
4. **flagged** - Image flagged for review
5. **approved** - Image approved
6. **rejected** - Image rejected

## Metadata Fields

### Industry Classification

Common industry values:
- `insurance`
- `retail`
- `automotive`
- `healthcare`
- `financial`
- `telecommunications`
- `travel`
- `food_beverage`

### Mail Type Classification

Common mail type values:
- `postcard`
- `catalog`
- `flyer`
- `envelope`
- `magazine`
- `brochure`
- `coupon`

### Brand Name

The brand or company name sending the marketing mail.

## Database Triggers

### Automatic Points Award

```sql
-- Trigger: Award 5 points on mail_packages insert
CREATE TRIGGER trigger_mail_package_scan_points
  AFTER INSERT ON mail_packages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_mail_package_scan_points();

-- Trigger: Award 5 points when status = 'completed'
CREATE TRIGGER trigger_mail_package_review_points
  AFTER UPDATE ON mail_packages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_mail_package_review_points();
```

### S3 Key Update

```sql
-- Trigger: Update mail_packages.s3_key with first image
CREATE TRIGGER update_mail_package_s3_key_trigger
  AFTER INSERT ON mail_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_mail_package_s3_key();
```

### Metadata Sync

```sql
-- Trigger: Sync industry/brand_name from mail_scans to mail_packages
CREATE TRIGGER update_mail_package_from_scans_trigger
  AFTER INSERT OR UPDATE ON mail_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_mail_package_from_scans();
```

## Security

### Access Control

- **Panelists**: Can only view and create their own mail packages
- **Admins**: Can view and manage all mail packages
- **Database**: Row Level Security (RLS) policies enforce access

### File Upload Security

- Presigned URLs with expiration
- File type validation
- File size limits
- S3 bucket policies

### Image Access

- Presigned URLs for secure image viewing
- URLs expire after set time
- Access logged for audit

## Mobile App Integration

Mobile apps (Android/iOS) integrate with the mail scanning system via:

1. **Authentication**: Clerk mobile SDKs
2. **Image Capture**: Native camera APIs
3. **Upload**: Presigned URL uploads to S3
4. **API Calls**: RESTful API endpoints
5. **Real-time Updates**: WebSocket connections

See [Mobile API Authentication](mobile-api-authentication.md) for integration details.

## Analytics

### Metrics Tracked

- Total packages submitted
- Packages by status
- Points awarded for mail scanning
- Average scans per package
- Processing time
- Rejection rate
- Industry distribution
- Mail type distribution

### Admin Dashboard

Admins can view:
- Daily/weekly/monthly submission counts
- Status distribution charts
- Points awarded charts
- Processing time metrics
- Rejection reasons

## Troubleshooting

### Common Issues

**Images not uploading**
- Check S3 bucket permissions
- Verify presigned URL expiration
- Check file size limits

**Points not awarded**
- Verify database triggers are active
- Check point_ledger for transaction records
- Verify package status is correct

**Images not displaying**
- Check S3 key format
- Verify presigned URL generation
- Check CORS settings on S3 bucket

**Package status not updating**
- Verify admin permissions
- Check API endpoint authentication
- Review database constraints

## Future Enhancements

Planned improvements:

- **AI Classification**: Automatic industry/brand detection
- **Duplicate Detection**: Identify duplicate mail submissions
- **Quality Scoring**: Rate image quality automatically
- **Bulk Processing**: Process multiple packages at once
- **Export**: Export package data for analysis
- **Notifications**: Email notifications for status changes

