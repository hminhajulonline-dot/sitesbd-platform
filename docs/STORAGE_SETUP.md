# Storage Setup Guide

This document describes the storage configuration for SitesBD Platform.

## Storage Buckets

The platform uses three storage buckets for different purposes:

| Bucket | Public | Purpose | File Size Limit | Allowed MIME Types |
|--------|--------|---------|-----------------|-------------------|
| `avatars` | Yes | User profile avatars | 2MB | image/jpeg, image/png, image/webp, image/gif |
| `cms-assets` | Yes | CMS uploaded assets and media | 10MB | image/jpeg, image/png, image/webp, image/gif, application/pdf |
| `documents` | No | User and business documents | 50MB | application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document |

## Bucket Configuration

### Creating Buckets

#### Via Supabase Dashboard

1. Go to Storage in your Supabase project
2. Click "New Bucket"
3. Enter bucket name and configure public access
4. Set file size limits in bucket settings

#### Via SQL

```sql
-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', true, 2097152);

-- Create cms-assets bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('cms-assets', 'cms-assets', true, 10485760);

-- Create documents bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 52428800);
```

## Storage RLS Policies

### Avatars Bucket

```sql
-- Allow authenticated users to upload their own avatar
CREATE POLICY "Authenticated users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow anyone to view avatars (public bucket)
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### CMS Assets Bucket

```sql
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
USING (bucket_id = 'cms-assets' AND EXISTS (
  SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
));
```

### Documents Bucket

```sql
-- Only authenticated users can upload documents
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can only view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all documents
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND EXISTS (
  SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
));
```

## Storage Client Usage

### Upload File

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function uploadAvatar(file: File, userId: string) {
  const filePath = `${userId}/avatar`;
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);
  
  return publicUrl;
}
```

### Download File

```typescript
async function downloadDocument(filePath: string) {
  const { data, error } = await supabase.storage
    .from('documents')
    .download(filePath);
  
  if (error) throw error;
  return data;
}
```

### Delete File

```typescript
async function deleteAvatar(userId: string) {
  const filePath = `${userId}/avatar`;
  
  const { error } = await supabase.storage
    .from('avatars')
    .remove([filePath]);
  
  if (error) throw error;
}
```

### List Files

```typescript
async function listDocuments(userId: string) {
  const { data, error } = await supabase.storage
    .from('documents')
    .list(userId, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });
  
  if (error) throw error;
  return data;
}
```

## Upload Validation

### File Size Validation

```typescript
const MAX_FILE_SIZES = {
  avatars: 2 * 1024 * 1024, // 2MB
  'cms-assets': 10 * 1024 * 1024, // 10MB
  documents: 50 * 1024 * 1024, // 50MB
};

function validateFileSize(file: File, bucket: string): boolean {
  const maxSize = MAX_FILE_SIZES[bucket] || 0;
  return file.size <= maxSize;
}
```

### MIME Type Validation

```typescript
const ALLOWED_TYPES = {
  avatars: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  'cms-assets': ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

function validateFileType(file: File, bucket: string): boolean {
  const allowed = ALLOWED_TYPES[bucket] || [];
  return allowed.includes(file.type);
}
```

## Storage Health Check

```typescript
import { checkStorageHealth } from '@sitesbd/shared/services/health';

async function checkStorage() {
  const health = await checkStorageHealth();
  
  console.log(`Storage Status: ${health.status}`);
  if (health.latency) {
    console.log(`Latency: ${health.latency}ms`);
  }
  if (health.error) {
    console.log(`Error: ${health.error}`);
  }
}
```

## Troubleshooting

### Upload Fails with 413

The file exceeds the bucket's file size limit. Check the configuration in Supabase dashboard or update the limit via SQL.

### Upload Fails with 400

The MIME type is not allowed. Check the allowed MIME types for the bucket.

### Access Denied (403)

Check RLS policies for the bucket. Ensure:
1. User is authenticated (for private buckets)
2. User has the correct ownership check (folder name matches user ID)
3. Policy is enabled

### Public URL Returns 404

1. Verify the file exists in storage
2. Check if the bucket is marked as public
3. Verify RLS policy allows public access

## Related Documentation

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md)
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)