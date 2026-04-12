const db = require('../db');

// @route   GET /api/cart
// @desc    Get user's cart items
exports.getCart = async (req, res) => {
  try {
    const [cartRows] = await db.query('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
    if (cartRows.length === 0) return res.json([]);
    const cartId = cartRows[0].id;

    const [items] = await db.query(`
      SELECT ci.product_id, ci.quantity, p.name, p.price, p.image 
      FROM cart_items ci 
      JOIN products p ON ci.product_id = p.id 
      WHERE ci.cart_id = ?
    `, [cartId]);

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching cart' });
  }
};

// @route   POST /api/cart/add
// @desc    Add item to cart
exports.addToCart = async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  try {
    const [cartRows] = await db.query('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
    let cartId;
    
    if (cartRows.length === 0) {
      const [newCart] = await db.query('INSERT INTO cart (user_id) VALUES (?)', [req.user.id]);
      cartId = newCart.insertId;
    } else {
      cartId = cartRows[0].id;
    }

    // Check if item exists
    const [itemRows] = await db.query('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, product_id]);
    
    if (itemRows.length > 0) {
      await db.query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, itemRows[0].id]);
    } else {
      await db.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)', [cartId, product_id, quantity]);
    }

    res.status(200).json({ message: 'Added to cart' });
  } catch (error) {
    res.status(500).json({ error: 'Error modifying cart' });
  }
};

// @route   POST /api/cart/remove
// @desc    Remove whole item from cart
exports.removeFromCart = async (req, res) => {
  const { product_id } = req.body;
  try {
    const [cartRows] = await db.query('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
    if (cartRows.length > 0) {
      await db.query('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartRows[0].id, product_id]);
    }
    res.json({ message: 'Item removed' });
  } catch (error) {
    res.status(500).json({ error: 'Error modifying cart' });
  }
};
