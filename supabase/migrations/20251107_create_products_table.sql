-- Migration: create products and product_images tables + product-images storage bucket and policies

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  offer_price NUMERIC(12,2),
  is_offer BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on product_images and products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Grant and policies: simple policies that allow authenticated to insert and anon to select
DROP POLICY IF EXISTS "Products authenticated manage" ON products;
CREATE POLICY "Products authenticated manage" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT ON products TO anon;
GRANT ALL ON products TO authenticated;

DROP POLICY IF EXISTS "Product images authenticated manage" ON product_images;
CREATE POLICY "Product images authenticated manage" ON product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT ON product_images TO anon;
GRANT ALL ON product_images TO authenticated;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET name = 'product-images', public = true, file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

-- Storage policies for product-images
DROP POLICY IF EXISTS "Allow public read access product-images" ON storage.objects;
CREATE POLICY "Allow public read access product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow authenticated users to upload product-images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow users to update their own product images" ON storage.objects;
CREATE POLICY "Allow users to update their own product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow users to delete their own product images" ON storage.objects;
CREATE POLICY "Allow users to delete their own product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_created_at ON product_images(created_at);
