-- Seed data for mail scanning system
-- This should be run after the migration-mail-scanning.sql

-- Sample mail packages (assuming we have some panelist_profiles)
-- Note: You'll need to replace the panelist_id values with actual UUIDs from your panelist_profiles table

-- Insert sample mail packages
INSERT INTO mail_packages (panelist_id, total_images, status, points_awarded, is_approved) VALUES
  -- Get the first panelist profile for sample data
  ((SELECT id FROM panelist_profiles LIMIT 1), 2, 'reviewed', 50, true),
  ((SELECT id FROM panelist_profiles LIMIT 1), 1, 'complete', 0, NULL),
  ((SELECT id FROM panelist_profiles LIMIT 1), 4, 'reviewed', 100, true),
  ((SELECT id FROM panelist_profiles LIMIT 1), 3, 'incomplete', 0, NULL),
  ((SELECT id FROM panelist_profiles LIMIT 1), 2, 'reviewed', 25, false);

-- Insert sample mail scans
INSERT INTO mail_scans (
  panelist_id, 
  mailpack_id, 
  image_filename, 
  s3_key, 
  file_size_bytes, 
  image_sequence, 
  industry, 
  mail_type, 
  brand_name, 
  scan_status
) 
SELECT 
  mp.panelist_id,
  mp.id,
  CASE 
    WHEN mp.total_images = 1 THEN 'postcard_front.jpg'
    WHEN mp.total_images = 2 THEN 
      CASE ms.image_sequence 
        WHEN 1 THEN 'postcard_front.jpg'
        WHEN 2 THEN 'postcard_back.jpg'
      END
    WHEN mp.total_images = 3 THEN 
      CASE ms.image_sequence 
        WHEN 1 THEN 'catalog_cover.jpg'
        WHEN 2 THEN 'catalog_page1.jpg'
        WHEN 3 THEN 'catalog_page2.jpg'
      END
    WHEN mp.total_images = 4 THEN 
      CASE ms.image_sequence 
        WHEN 1 THEN 'insurance_front.jpg'
        WHEN 2 THEN 'insurance_back.jpg'
        WHEN 3 THEN 'insurance_terms.jpg'
        WHEN 4 THEN 'insurance_contact.jpg'
      END
  END,
  CASE 
    WHEN mp.total_images = 1 THEN '2024/01/' || mp.panelist_id::text || '/' || mp.id::text || '/postcard_front.jpg'
    WHEN mp.total_images = 2 THEN '2024/01/' || mp.panelist_id::text || '/' || mp.id::text || '/' ||
      CASE ms.image_sequence 
        WHEN 1 THEN 'postcard_front.jpg'
        WHEN 2 THEN 'postcard_back.jpg'
      END
    WHEN mp.total_images = 3 THEN '2024/01/' || mp.panelist_id::text || '/' || mp.id::text || '/' ||
      CASE ms.image_sequence 
        WHEN 1 THEN 'catalog_cover.jpg'
        WHEN 2 THEN 'catalog_page1.jpg'
        WHEN 3 THEN 'catalog_page2.jpg'
      END
    WHEN mp.total_images = 4 THEN '2024/01/' || mp.panelist_id::text || '/' || mp.id::text || '/' ||
      CASE ms.image_sequence 
        WHEN 1 THEN 'insurance_front.jpg'
        WHEN 2 THEN 'insurance_back.jpg'
        WHEN 3 THEN 'insurance_terms.jpg'
        WHEN 4 THEN 'insurance_contact.jpg'
      END
  END,
  CASE 
    WHEN mp.total_images = 1 THEN 2457600  -- ~2.4MB
    WHEN mp.total_images = 2 THEN 2048000  -- ~2MB
    WHEN mp.total_images = 3 THEN 5120000  -- ~5MB
    WHEN mp.total_images = 4 THEN 8192000  -- ~8MB
  END,
  ms.image_sequence,
  CASE 
    WHEN mp.total_images = 1 THEN 'retail'
    WHEN mp.total_images = 2 THEN 'automotive'
    WHEN mp.total_images = 3 THEN 'retail'
    WHEN mp.total_images = 4 THEN 'insurance'
  END,
  CASE 
    WHEN mp.total_images = 1 THEN 'postcard'
    WHEN mp.total_images = 2 THEN 'postcard'
    WHEN mp.total_images = 3 THEN 'catalog'
    WHEN mp.total_images = 4 THEN 'envelope'
  END,
  CASE 
    WHEN mp.total_images = 1 THEN 'Walmart'
    WHEN mp.total_images = 2 THEN 'Toyota'
    WHEN mp.total_images = 3 THEN 'Target'
    WHEN mp.total_images = 4 THEN 'State Farm'
  END,
  CASE 
    WHEN mp.status = 'reviewed' THEN 'approved'
    WHEN mp.status = 'complete' THEN 'uploaded'
    WHEN mp.status = 'incomplete' THEN 'uploaded'
  END
FROM mail_packages mp
CROSS JOIN (
  SELECT 1 as image_sequence UNION ALL
  SELECT 2 UNION ALL
  SELECT 3 UNION ALL
  SELECT 4
) ms
WHERE ms.image_sequence <= mp.total_images;

-- Insert sample scan sessions
INSERT INTO scan_sessions (panelist_id, device_info, location_data, session_end, total_scans) VALUES
  ((SELECT id FROM panelist_profiles LIMIT 1), 
   '{"device_type": "iPhone", "app_version": "1.2.0", "os_version": "iOS 17.0"}',
   '{"latitude": 40.7128, "longitude": -74.0060, "city": "New York"}',
   NOW() + INTERVAL '30 minutes',
   3),
  ((SELECT id FROM panelist_profiles LIMIT 1), 
   '{"device_type": "Android", "app_version": "1.1.5", "os_version": "Android 13"}',
   '{"latitude": 34.0522, "longitude": -118.2437, "city": "Los Angeles"}',
   NOW() + INTERVAL '45 minutes',
   2);

-- Update the total_images count in mail_packages to match actual scan count
UPDATE mail_packages 
SET total_images = (
  SELECT COUNT(*) 
  FROM mail_scans 
  WHERE mailpack_id = mail_packages.id
); 