const db = require('../db');

// @route   POST /api/admin/products
exports.addProduct = async (req, res) => {
  const { name, price, image, description } = req.body;
  try {
    await db.query('INSERT INTO products (name, price, image, description) VALUES (?, ?, ?, ?)', 
      [name, price, image, description]);
    res.status(201).json({ message: 'Product added' });
  } catch (error) {
    res.status(500).json({ error: 'Insert failed' });
  }
};

// @route   DELETE /api/admin/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
};

// @route   GET /api/admin/orders
exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.*, u.name as user_name, u.email as user_email 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `);
    
    for (let order of orders) {
      const [items] = await db.query(`
        SELECT oi.quantity, p.name, p.image, p.price 
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = ?`, 
      [order.id]);
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
};

// @route   PUT /api/admin/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
};
