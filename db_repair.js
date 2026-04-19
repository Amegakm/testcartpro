const { Client } = require('pg');

const connectionString = 'postgresql://postgres:[26M8DtIrR9N5Je77]@db.ramilygjinfrmbvztbyc.supabase.co:5432/postgres';

const sql = `
-- Drop existing if any
DROP TABLE IF EXISTS payments, order_items, orders, cart_items, cart, products, feedback CASCADE;

-- 1. PRODUCTS
CREATE TABLE products (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  price integer NOT NULL,
  image text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- 2. CART
CREATE TABLE cart (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- 3. CART ITEMS
CREATE TABLE cart_items (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  cart_id bigint NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  UNIQUE(cart_id, product_id)
);

-- 4. ORDERS
CREATE TABLE orders (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL,
  total integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled')),
  shipping_address text,
  created_at timestamptz DEFAULT now()
);

-- 5. ORDER ITEMS
CREATE TABLE order_items (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL
);

-- 6. PAYMENTS
CREATE TABLE payments (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  razorpay_payment_id text,
  razorpay_order_id text,
  razorpay_signature text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'cod_pending')),
  created_at timestamptz DEFAULT now()
);

-- 7. FEEDBACK
CREATE TABLE feedback (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- DISABLE RLS FOR EVERYTHING (UNRESTRICTED)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;

-- SEED DATA
INSERT INTO products (name, price, image, description) VALUES
('Wireless Headphones', 1999, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', 'High-quality wireless headphones with noise cancellation.'),
('Smart Watch', 2999, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', 'Feature-rich smartwatch with health tracking and notifications.'),
('Bluetooth Speaker', 1499, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80', 'Portable Bluetooth speaker with deep bass and long battery life.'),
('Gaming Mouse', 999, 'https://images.unsplash.com/photo-1527814050087-379381547969?w=500&q=80', 'Ergonomic gaming mouse with customizable RGB lighting.'),
('Mechanical Keyboard', 3499, 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80', 'Tactile mechanical keyboard with clicky switches.'),
('Laptop Backpack', 1299, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80', 'Durable and water-resistant laptop backpack.');
`;

async function run() {
  const client = new Client({ connectionString });
  try {
    console.log('Connecting to Supabase Postgres...');
    await client.connect();
    console.log('Running schema migration and RLS removal...');
    await client.query(sql);
    console.log('SUCCESS: Database is now fully built and UNRESTRICTED.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
