import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const DELIVERY_FEE = 40;

export default function Checkout() {
  const { user } = useContext(AuthContext);
  const { cartItems, cartTotal, clearCart, setIsCartOpen } = useContext(CartContext);
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: 'India',
    phone: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addressString = `${form.firstName} ${form.lastName}, ${form.street}, ${form.city}, ${form.state} - ${form.zipcode}, ${form.country}. Phone: ${form.phone}`;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return alert('Your cart is empty!');

    setLoading(true);
    try {
      if (paymentMethod === 'cod') {
        // COD — create order directly, no payment gateway
        await apiFetch('/orders/create', {
          method: 'POST',
          body: JSON.stringify({
            items: cartItems,
            total: cartTotal + DELIVERY_FEE,
            address: addressString,
            paymentMethod: 'cod',
          }),
        });
        clearCart();
        setIsCartOpen(false);
        alert('🎉 Order placed successfully! Pay on delivery.');
        navigate('/orders');
      } else {
        // UPI / Razorpay
        const orderData = await apiFetch('/orders/create', {
          method: 'POST',
          body: JSON.stringify({
            items: cartItems,
            total: cartTotal + DELIVERY_FEE,
            address: addressString,
            paymentMethod: 'razorpay',
          }),
        });

        // Mock fallback if Razorpay keys missing
        if (!orderData.razorpayOrderId || orderData.razorpayOrderId.startsWith('mock_')) {
          clearCart();
          setIsCartOpen(false);
          alert('✅ Mock Payment Successful! (Add Razorpay keys for live payments)');
          navigate('/orders');
          return;
        }

        const options = {
          key: orderData.razorpayKey || '',
          amount: (cartTotal + DELIVERY_FEE) * 100,
          currency: 'INR',
          name: 'TestCart Pro',
          description: 'Order Payment',
          order_id: orderData.razorpayOrderId,
          prefill: {
            name: `${form.firstName} ${form.lastName}`,
            email: form.email,
            contact: form.phone,
          },
          notes: { address: addressString },
          theme: { color: '#0f172a' },
          handler: async function (response) {
            try {
              await apiFetch('/orders/verify', {
                method: 'POST',
                body: JSON.stringify({
                  orderId: orderData.orderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              clearCart();
              setIsCartOpen(false);
              alert('🎉 Payment Verified & Successful!');
              navigate('/orders');
            } catch {
              alert('❌ Payment verification failed.');
            }
          },
          modal: { ondismiss: () => setLoading(false) },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="checkout-page">
      <h1 className="checkout-title">Checkout</h1>

      <form className="checkout-layout" onSubmit={handlePlaceOrder}>
        {/* LEFT — Delivery Info */}
        <div className="checkout-left">
          <h2 className="section-heading">Delivery Information</h2>

          <div className="form-row">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="street"
            placeholder="Street Address"
            value={form.street}
            onChange={handleChange}
            required
          />

          <div className="form-row">
            <input
              type="text"
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="state"
              placeholder="State"
              value={form.state}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <input
              type="text"
              name="zipcode"
              placeholder="Zipcode"
              value={form.zipcode}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={form.country}
              onChange={handleChange}
              required
            />
          </div>

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            required
          />
        </div>

        {/* RIGHT — Cart Totals + Payment */}
        <div className="checkout-right">
          {/* Cart Totals */}
          <div className="checkout-box">
            <h2 className="section-heading">Cart Totals</h2>
            <div className="totals-row">
              <span>Subtotal</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="totals-row">
              <span>Delivery Fee</span>
              <span>₹{DELIVERY_FEE}</span>
            </div>
            <div className="totals-row totals-total">
              <span>Total</span>
              <span>₹{(cartTotal + DELIVERY_FEE).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="checkout-box">
            <h2 className="section-heading">Payment Method</h2>

            <label
              className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('cod')}
            >
              <span className={`radio-dot ${paymentMethod === 'cod' ? 'active' : ''}`}></span>
              <div>
                <strong>COD</strong>
                <span>Cash on Delivery</span>
              </div>
            </label>

            <label
              className={`payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('upi')}
            >
              <span className={`radio-dot ${paymentMethod === 'upi' ? 'active' : ''}`}></span>
              <div>
                <strong>UPI / Card</strong>
                <span>Pay via Razorpay (UPI, Cards, Wallets)</span>
              </div>
              <img
                src="https://razorpay.com/assets/razorpay-glyph.svg"
                alt="Razorpay"
                className="razorpay-logo"
              />
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-green btn-full place-order-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Place Order →'}
          </button>
        </div>
      </form>
    </div>
  );
}
