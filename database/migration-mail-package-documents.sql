-- Migration: Mail Package Documents System
-- Run this to add support for OCR text and supporting documents
-- This migration is safe to run multiple times as it uses IF NOT EXISTS clauses

-- Create mail_package_documents table for storing OCR text and supporting documents
CREATE TABLE IF NOT EXISTS mail_package_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mail_package_id UUID NOT NULL REFERENCES mail_packages(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('ocr_text', 'supporting_document', 'metadata')),
  s3_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mail_package_documents_package_id') THEN
    CREATE INDEX idx_mail_package_documents_package_id ON mail_package_documents(mail_package_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mail_package_documents_type') THEN
    CREATE INDEX idx_mail_package_documents_type ON mail_package_documents(document_type);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mail_package_documents_s3_key') THEN
    CREATE INDEX idx_mail_package_documents_s3_key ON mail_package_documents(s3_key);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE mail_package_documents ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Panelists can view own mail package documents" ON mail_package_documents FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM mail_packages mp
        JOIN panelist_profiles pp ON mp.panelist_id = pp.id
        WHERE mp.id = mail_package_documents.mail_package_id 
        AND pp.user_id = auth.uid()::text
    )
);

CREATE POLICY "Panelists can insert own mail package documents" ON mail_package_documents FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM mail_packages mp
        JOIN panelist_profiles pp ON mp.panelist_id = pp.id
        WHERE mp.id = mail_package_documents.mail_package_id 
        AND pp.user_id = auth.uid()::text
    )
);

CREATE POLICY "Admins can manage all mail package documents" ON mail_package_documents FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text 
        AND role IN ('survey_admin', 'system_admin')
    )
);

-- Add comments for documentation
COMMENT ON TABLE mail_package_documents IS 'Stores OCR text and supporting documents for mail packages';
COMMENT ON COLUMN mail_package_documents.document_type IS 'Type of document: ocr_text, supporting_document, or metadata';
COMMENT ON COLUMN mail_package_documents.s3_key IS 'S3 key for the uploaded document file';
COMMENT ON COLUMN mail_package_documents.mime_type IS 'MIME type of the uploaded file (e.g., text/plain, application/json)';

-- Verify the migration
SELECT 'Migration completed successfully' as status;
