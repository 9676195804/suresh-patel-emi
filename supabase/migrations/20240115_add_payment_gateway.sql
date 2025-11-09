-- Create payment_orders table for Razorpay integration
CREATE TABLE IF NOT EXISTS payment_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(20) NOT NULL DEFAULT 'created',
  customer_id TEXT NOT NULL,
  emi_id TEXT NOT NULL,
  purchase_id TEXT NOT NULL,
  razorpay_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (emi_id) REFERENCES emi_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
);

-- Create payments table to store payment details
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  razorpay_payment_id TEXT UNIQUE NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  razorpay_signature TEXT,
  emi_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'created',
  payment_method VARCHAR(50),
  captured_at TIMESTAMPTZ,
  error_code VARCHAR(50),
  error_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (emi_id) REFERENCES emi_schedules(id) ON DELETE CASCADE
);

-- Create payment_disputes table for handling disputes
CREATE TABLE IF NOT EXISTS payment_disputes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  dispute_id TEXT UNIQUE NOT NULL,
  payment_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  reason VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

-- Add Razorpay settings
INSERT INTO settings (key, value, description) VALUES 
  ('razorpay_key', 'rzp_test_1234567890', 'Razorpay Key ID for payment gateway'),
  ('razorpay_secret', 'test_secret_key', 'Razorpay Key Secret for payment gateway'),
  ('razorpay_webhook_secret', 'test_webhook_secret', 'Razorpay Webhook Secret for payment verification')
ON CONFLICT (key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_orders_customer_id ON payment_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_emi_id ON payment_orders(emi_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payments_emi_id ON payments(emi_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_payment_id ON payment_disputes(payment_id);

-- Add RLS policies for payment tables
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_orders
CREATE POLICY "Admins can view all payment orders" ON payment_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Customers can view their own payment orders" ON payment_orders
  FOR SELECT USING (
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM customers WHERE id = customer_id AND mobile = (
        SELECT mobile FROM customers WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage payment orders" ON payment_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for payments
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Customers can view their own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM emi_schedules es
      JOIN purchases p ON p.id = es.purchase_id
      JOIN customers c ON c.id = p.customer_id
      WHERE es.id = payments.emi_id AND c.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for payment_disputes
CREATE POLICY "Admins can view all payment disputes" ON payment_disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage payment disputes" ON payment_disputes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add payment method column to emi_schedules
ALTER TABLE emi_schedules 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash';

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_orders_updated_at 
  BEFORE UPDATE ON payment_orders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_disputes_updated_at 
  BEFORE UPDATE ON payment_disputes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();