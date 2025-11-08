-- Create purchase_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS purchase_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE purchase_images ENABLE ROW LEVEL SECURITY;

-- Create policies for purchase_images
CREATE POLICY IF NOT EXISTS "Admins can manage purchase images" ON purchase_images
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create storage bucket for purchase images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('purchase-images', 'purchase-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for purchase images
CREATE POLICY IF NOT EXISTS "Allow public read access" ON storage.objects
FOR SELECT
USING (bucket_id = 'purchase-images');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to upload" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'purchase-images' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow users to update their own images" ON storage.objects
FOR UPDATE
USING (bucket_id = 'purchase-images' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow users to delete their own images" ON storage.objects
FOR DELETE
USING (bucket_id = 'purchase-images' AND auth.role() = 'authenticated');