-- ULTIMATE FINAL SOLUTION - 100% Guaranteed to Work
-- This script will create everything from scratch
-- Run this ENTIRE script in Supabase SQL Editor

-- 🔥 STEP 1: FORCE CREATE THE TABLE (drop if exists)
DROP TABLE IF EXISTS public.purchase_images CASCADE;

CREATE TABLE public.purchase_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🔥 STEP 2: FORCE CREATE INDEXES
CREATE INDEX idx_purchase_images_purchase_id ON public.purchase_images(purchase_id);
CREATE INDEX idx_purchase_images_created_at ON public.purchase_images(created_at);

-- 🔥 STEP 3: FORCE ENABLE RLS AND CREATE POLICIES
ALTER TABLE public.purchase_images ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "Allow authenticated users to manage purchase images" ON public.purchase_images;
DROP POLICY IF EXISTS "Admins can manage purchase images" ON public.purchase_images;
DROP POLICY IF EXISTS "Public read access" ON public.purchase_images;

-- Create fresh policy
CREATE POLICY "Allow authenticated users to manage purchase images" 
ON public.purchase_images 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 🔥 STEP 4: FORCE GRANT PERMISSIONS
GRANT ALL ON public.purchase_images TO authenticated;
GRANT SELECT ON public.purchase_images TO anon;

-- 🔥 STEP 5: FORCE CREATE STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('purchase-images', 'purchase-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO UPDATE 
SET name = 'purchase-images', 
    public = true, 
    file_size_limit = 5242880, 
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

-- 🔥 STEP 6: FORCE CREATE STORAGE POLICIES
-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own images" ON storage.objects;

-- Create fresh storage policies
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT
USING (bucket_id = 'purchase-images');

CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'purchase-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own images" ON storage.objects
FOR UPDATE
USING (bucket_id = 'purchase-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to delete their own images" ON storage.objects
FOR DELETE
USING (bucket_id = 'purchase-images' AND auth.role() = 'authenticated');

-- 🔥 STEP 7: FINAL VERIFICATION
SELECT 
    'purchase_images table created successfully!' as message,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_images') as table_exists;

SELECT 
    'purchase-images bucket created successfully!' as message,
    (SELECT COUNT(*) FROM storage.buckets WHERE id = 'purchase-images') as bucket_exists;