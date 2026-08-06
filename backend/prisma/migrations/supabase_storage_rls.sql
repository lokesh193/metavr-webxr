-- Supabase Storage Row Level Security (RLS) Policies Migration for "webxr-assets" Bucket

-- 1. Ensure public bucket 'webxr-assets' exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('webxr-assets', 'webxr-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Clean up old policy rules
DROP POLICY IF EXISTS "Public Read Access for webxr-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access for webxr-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Access for webxr-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Access for webxr-assets" ON storage.objects;

-- 3. Allow SELECT access to public, anon, and authenticated roles
CREATE POLICY "Public Read Access for webxr-assets"
ON storage.objects
FOR SELECT
TO public, anon, authenticated
USING (bucket_id = 'webxr-assets');

-- 4. Allow INSERT access to public, anon, and authenticated roles
CREATE POLICY "Public Insert Access for webxr-assets"
ON storage.objects
FOR INSERT
TO public, anon, authenticated
WITH CHECK (bucket_id = 'webxr-assets');

-- 5. Allow UPDATE access to public, anon, and authenticated roles
CREATE POLICY "Public Update Access for webxr-assets"
ON storage.objects
FOR UPDATE
TO public, anon, authenticated
USING (bucket_id = 'webxr-assets');
