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
      SELECT 
        o.id, o.total, o.status, o.created_at,
        o.shipping_address,
        u.name  AS user_name,
        u.email AS user_email,
        p.status AS payment_status
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN payments p ON p.order_id = o.id
      ORDER BY o.created_at DESC
    `);

    for (let order of orders) {
      const [items] = await db.query(`
        SELECT oi.quantity, pr.name, pr.image, pr.price
        FROM order_items oi
        JOIN products pr ON oi.product_id = pr.id
        WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error('Admin orders error:', error);
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
