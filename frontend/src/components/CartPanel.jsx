import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

export default function CartPanel() {
  const { user } = useContext(AuthContext);
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, cartTotal, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!user) return navigate('/login');
    if (cartItems.length === 0) return alert('Cart is empty!');

    try {
      // 1. Create Order backend entry
      const orderData = await apiFetch('/orders/create', {
        method: 'POST',
        body: JSON.stringify({ items: cartItems, total: cartTotal })
      });

      // Simple mock fallback if keys missing
      if (orderData.razorpayOrderId && orderData.razorpayOrderId.startsWith('mock_')) {
        alert('Mock Payment Successful!');
        clearCart();
        setIsCartOpen(false);
        navigate('/orders');
        return;
      }

      // 2. Open Actual Razorpay script
      const options = {
        key: "Will_Load_From_Backend", 
        amount: orderData.amount * 100,
        currency: "INR",
        name: "TestCart Pro",
        description: "Order Checkout",
        order_id: orderData.razorpayOrderId,
        handler: async function (response) {
          try {
            await apiFetch('/orders/verify', {
              method: 'POST',
              body: JSON.stringify({
                orderId: orderData.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            alert('Payment Verified & Successful!');
            clearCart();
            setIsCartOpen(false);
            navigate('/orders');
          } catch(e) { alert('Verification failed.'); }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#0f172a" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      alert('Checkout error');
    }
  };

  return (
    <>
      <div 
        className={`cart-overlay ${isCartOpen ? 'active' : ''}`} 
        onClick={() => setIsCartOpen(false)}
      ></div>
      
      <div className={`cart-panel ${isCartOpen ? 'active' : ''}`}>
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="btn" onClick={() => setIsCartOpen(false)}>X</button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.product_id} className="cart-item">
                <div className="cart-item-details">
                  <strong>{item.name}</strong>
                  <span>₹{item.price} x {item.quantity}</span>
                </div>
                <button className="btn btn-danger" onClick={() => removeFromCart(item.product_id)}>Drop</button>
              </div>
            ))
          )}
        </div>

        <div className="cart-actions">
          <h3>Total: ₹{cartTotal}</h3>
          <button className="btn btn-green btn-full" onClick={handleCheckout}>Checkout</button>
        </div>
      </div>
    </>
  );
}
