-- Revert payment gateway integration

-- Drop tables
DROP TABLE IF EXISTS payment_disputes;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS payment_orders;

-- Remove settings
DELETE FROM settings WHERE key IN ('razorpay_key', 'razorpay_secret', 'razorpay_webhook_secret');
