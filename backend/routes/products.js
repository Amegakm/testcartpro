const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Route: /api/products
router.get('/', productController.getProducts);

module.exports = router;
