
CREATE TABLE IF NOT EXISTS purchase_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE purchase_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage purchase images" ON purchase_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
