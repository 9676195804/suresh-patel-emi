# Manual Table Creation for Supabase

Since the migrations haven't been applied to your Supabase database, you need to manually create the missing tables. Here's how to do it:

## Step 1: Access Supabase Dashboard
1. Go to https://app.supabase.com
2. Sign in with your account
3. Select your project (should be the one with URL: https://istolikjzbdiwltccggh.supabase.co)

## Step 2: Open SQL Editor
1. In your project dashboard, click on "SQL Editor" in the left sidebar
2. Click "New query" to create a new SQL query

## Step 3: Run the following SQL commands

### Create purchase_images table:
```sql
CREATE TABLE IF NOT EXISTS purchase_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE purchase_images ENABLE ROW LEVEL SECURITY;

-- Create policy for admins
CREATE POLICY "Admins can manage purchase images" ON purchase_images
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
```

### Create storage bucket:
```sql
-- Create storage bucket for purchase images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('purchase-images', 'purchase-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
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
```

## Step 4: Test the setup
After running these SQL commands, try creating a new purchase with images. The upload should now work properly.

## Alternative: Check if is_admin function exists
If you get an error about the `is_admin()` function not existing, you may need to create it first:

```sql
-- Create is_admin function if it doesn't exist
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'your-admin-email@example.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Replace 'your-admin-email@example.com' with your actual admin email address.