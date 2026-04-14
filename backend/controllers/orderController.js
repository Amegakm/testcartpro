const db = require('../db');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret'
});

// @route   GET /api/orders
exports.getMyOrders = async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    
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
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// @route   POST /api/orders/create
// Creates order in DB — supports COD and Razorpay (UPI/Card)
exports.createOrder = async (req, res) => {
  try {
    const { items, total, address, paymentMethod } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items' });
    if (!address) return res.status(400).json({ error: 'Shipping address is required' });

    const isCOD = paymentMethod === 'cod';

    // Insert order
    const [orderResult] = await db.query(
      'INSERT INTO orders (user_id, total, shipping_address) VALUES (?, ?, ?)',
      [req.user.id, total, address]
    );
    const orderId = orderResult.insertId;

    // Insert items
    const orderItems = items.map(i => [orderId, i.product_id, i.quantity]);
    await db.query('INSERT INTO order_items (order_id, product_id, quantity) VALUES ?', [orderItems]);

    // Clear user cart
    const [cartRows] = await db.query('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
    if (cartRows.length > 0) {
      await db.query('DELETE FROM cart_items WHERE cart_id = ?', [cartRows[0].id]);
    }

    // COD — no Razorpay needed
    if (isCOD) {
      await db.query(
        'INSERT INTO payments (order_id, razorpay_order_id, status) VALUES (?, ?, ?)',
        [orderId, 'COD', 'cod_pending']
      );
      return res.status(201).json({ orderId, paymentMethod: 'cod', amount: total });
    }

    // Razorpay (UPI / Card)
    let rzpOrder;
    try {
      if (process.env.RAZORPAY_KEY_ID) {
        rzpOrder = await razorpay.orders.create({
          amount: total * 100,
          currency: 'INR',
          receipt: `receipt_order_${orderId}`
        });
      }
    } catch (e) {
      console.error('Razorpay Error:', e);
      rzpOrder = { id: `mock_rzp_${Date.now()}` };
    }

    await db.query(
      'INSERT INTO payments (order_id, razorpay_order_id, status) VALUES (?, ?, ?)',
      [orderId, rzpOrder ? rzpOrder.id : 'N/A', 'pending']
    );

    res.status(201).json({
      orderId,
      razorpayOrderId: rzpOrder ? rzpOrder.id : null,
      razorpayKey: process.env.RAZORPAY_KEY_ID || '',
      amount: total,
      currency: 'INR'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Order creation failed' });
  }
};

// @route   POST /api/payments/verify
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
  
  if (process.env.RAZORPAY_KEY_SECRET) {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                                    .update(body.toString())
                                    .digest('hex');
                                    
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid Payment Signature' });
    }
  }

  try {
    await db.query('UPDATE payments SET razorpay_payment_id = ?, razorpay_signature = ?, status = ? WHERE razorpay_order_id = ?', 
      [razorpay_payment_id, razorpay_signature, 'successful', razorpay_order_id]);
    res.json({ message: 'Payment verified successfully' });
  } catch(error) {
    res.status(500).json({ error: 'Database update failed' });
  }
};
