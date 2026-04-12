const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, cartController.getCart);
  
router.post('/add', protect, cartController.addToCart);
router.post('/remove', protect, cartController.removeFromCart);

module.exports = router;
