-- ============================================
-- Supabase Storage Setup Script
-- ============================================
-- This script creates the required storage buckets
-- for the SitesBD Platform
-- ============================================

-- Create avatars bucket (public - user profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Create cms-assets bucket (public - CMS media files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cms-assets',
  'cms-assets',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

-- Create documents bucket (private - user documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- ============================================
-- RLS Policies for Avatars Bucket
-- ============================================

-- Drop existing policies for avatars bucket
DROP POLICY IF EXISTS "Authenticated users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Authenticated users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view avatars (public bucket)
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- RLS Policies for CMS Assets Bucket
-- ============================================

-- Drop existing policies for cms-assets bucket
DROP POLICY IF EXISTS "Authenticated users can upload CMS assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can view CMS assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update CMS assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete CMS assets" ON storage.objects;

-- Allow authenticated users to upload CMS assets
CREATE POLICY "Authenticated users can upload CMS assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cms-assets');

-- Allow public to view CMS assets
CREATE POLICY "Public can view CMS assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cms-assets');

-- Allow authenticated users to manage CMS assets
CREATE POLICY "Authenticated users can update CMS assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'cms-assets');

-- Admin can delete CMS assets
CREATE POLICY "Admins can delete CMS assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cms-assets' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- RLS Policies for Documents Bucket
-- ============================================

-- Drop existing policies for documents bucket
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;

-- Only authenticated users can upload documents
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can only view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all documents
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- Enable RLS on storage.objects
-- ============================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;