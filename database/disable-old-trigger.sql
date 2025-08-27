-- Disable the old s3_key trigger since mobile app will handle this directly
DROP TRIGGER IF EXISTS update_mail_package_s3_key_trigger ON mail_scans;
