const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/products', protect, admin, adminController.addProduct);
router.delete('/products/:id', protect, admin, adminController.deleteProduct);
router.get('/orders', protect, admin, adminController.getAllOrders);
router.put('/orders/:id/status', protect, admin, adminController.updateOrderStatus);

module.exports = router;
