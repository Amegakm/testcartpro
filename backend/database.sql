CREATE DATABASE IF NOT EXISTS testcart;
USE testcart;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  price INT NOT NULL,
  image TEXT,
  description TEXT
);

-- CART
CREATE TABLE IF NOT EXISTS cart (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CART ITEMS
CREATE TABLE IF NOT EXISTS cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(cart_id, product_id)
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  total INT NOT NULL,
  status ENUM('pending', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  shipping_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  razorpay_payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  status ENUM('pending', 'successful', 'failed', 'cod_pending') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- FEEDBACK
CREATE TABLE IF NOT EXISTS feedback (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SAMPLE ADMIN (password is 'admin123' hashed using bcrypt 10 rounds)
INSERT IGNORE INTO users (id, name, email, password, role) VALUES 
(1, 'Admin User', 'admin@testcart.com', '$2b$10$3s.zD/E10Q.1VnE.Iit54.LdG/oA.M58O9P208H8qXXZJ2N5F8.hK', 'admin');

-- SAMPLE PRODUCTS
INSERT INTO products (name, price, image, description) VALUES 
('Wireless Headphones', 1999, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', 'High-quality wireless headphones with noise cancellation.'),
('Smart Watch', 2999, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', 'Feature-rich smartwatch with health tracking and notifications.'),
('Bluetooth Speaker', 1499, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80', 'Portable Bluetooth speaker with deep bass and long battery life.'),
('Gaming Mouse', 999, 'https://images.unsplash.com/photo-1527814050087-379381547969?w=500&q=80', 'Ergonomic gaming mouse with customizable RGB lighting.'),
('Mechanical Keyboard', 3499, 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80', 'Tactile mechanical keyboard with clicky switches.'),
('Laptop Backpack', 1299, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80', 'Durable and water-resistant laptop backpack.');