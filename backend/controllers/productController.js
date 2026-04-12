const db = require('../db');

// @route   GET /api/products
// @desc    Get all products from DB
exports.getProducts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error while fetching products' });
  }
};