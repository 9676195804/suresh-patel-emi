-- FINAL WORKING SOLUTION - Handles existing policies
-- Run this entire script in Supabase SQL Editor

-- Step 1: Drop existing policies (clean slate)
DROP POLICY IF EXISTS "Allow authenticated users to manage purchase images" ON public.purchase_images;
DROP POLICY IF EXISTS "Admins can manage purchase images" ON public.purchase_images;

-- Step 2: Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.purchase_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_purchase_images_purchase_id ON public.purchase_images(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_images_created_at ON public.purchase_images(created_at);

-- Step 4: Enable Row Level Security
ALTER TABLE public.purchase_images ENABLE ROW LEVEL SECURITY;

-- Step 5: Create fresh policy for authenticated users
CREATE POLICY "Allow authenticated users to manage purchase images" 
ON public.purchase_images 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Step 6: Grant permissions
GRANT ALL ON public.purchase_images TO authenticated;
GRANT SELECT ON public.purchase_images TO anon;

-- Step 7: Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('purchase-images', 'purchase-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Step 8: Drop existing storage policies (clean slate)
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own images" ON storage.objects;

-- Step 9: Create fresh storage policies
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

-- Step 10: Verify everything is working
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'purchase_images';