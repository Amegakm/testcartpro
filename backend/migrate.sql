-- Run this once to update existing database schema
-- (Only needed if database was already created without these columns)

USE testcart;

-- Add shipping_address column to orders if not exists
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS shipping_address TEXT AFTER status;

-- Update status enum to include 'cancelled'
ALTER TABLE orders 
  MODIFY COLUMN status ENUM('pending', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending';

-- Update payments status enum to include 'cod_pending'
ALTER TABLE payments 
  MODIFY COLUMN status ENUM('pending', 'successful', 'failed', 'cod_pending') DEFAULT 'pending';
