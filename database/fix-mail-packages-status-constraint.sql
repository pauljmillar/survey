-- Check the current constraint on mail_packages.status
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'mail_packages'::regclass 
AND contype = 'c';

-- Drop the existing constraint if it exists
ALTER TABLE mail_packages DROP CONSTRAINT IF EXISTS mail_packages_status_check;

-- Add the correct constraint that includes all statuses used in the application
ALTER TABLE mail_packages ADD CONSTRAINT mail_packages_status_check 
CHECK (status IN ('pending', 'incomplete', 'processing', 'completed', 'rejected'));

-- Verify the constraint was added correctly
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'mail_packages'::regclass 
AND contype = 'c'; 