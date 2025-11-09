-- Create storage bucket for purchase images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('purchase-images', 'purchase-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']);

-- Create storage policies for purchase images
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