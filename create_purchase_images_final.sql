-- FINAL WORKING SOLUTION - Create purchase_images table
-- Run this entire script in Supabase SQL Editor

-- Step 1: Drop the table if it exists (clean slate)
DROP TABLE IF EXISTS public.purchase_images CASCADE;

-- Step 2: Create the table with proper structure
CREATE TABLE public.purchase_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX idx_purchase_images_purchase_id ON public.purchase_images(purchase_id);
CREATE INDEX idx_purchase_images_created_at ON public.purchase_images(created_at);

-- Step 4: Enable Row Level Security
ALTER TABLE public.purchase_images ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple policy for authenticated users
CREATE POLICY "Allow authenticated users to manage purchase images" 
ON public.purchase_images 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Step 6: Grant necessary permissions
GRANT ALL ON public.purchase_images TO authenticated;
GRANT SELECT ON public.purchase_images TO anon;

-- Step 7: Verify table was created
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'purchase_images';