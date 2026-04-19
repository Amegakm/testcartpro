import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const DELIVERY_FEE = 40;

export default function Checkout() {
  const { user } = useContext(AuthContext);
  const { cartItems, cartTotal, clearCart, setIsCartOpen } = useContext(CartContext);
  const { addToast } = useContext(ToastContext);
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
    if (cartItems.length === 0) return addToast('Your cart is empty!', 'error');

    setLoading(true);
    try {
      const total = cartTotal + DELIVERY_FEE;
      
      const orderData = {
        userId: user.id,
        userEmail: user.email,
        total,
        shippingAddress: addressString,
        status: 'pending',
        createdAt: serverTimestamp(),
        items: cartItems,
        payment: {
          method: paymentMethod,
          status: paymentMethod === 'cod' ? 'cod_pending' : 'successful',
          razorpayOrderId: paymentMethod === 'cod' ? 'COD' : `mock_${Date.now()}`
        }
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      await clearCart();
      setIsCartOpen(false);
      
      const successMsg = paymentMethod === 'cod' 
        ? 'Order placed successfully! Pay on delivery.' 
        : 'Mock Payment Successful! (Add Razorpay keys for live payments)';
        
      addToast(successMsg, 'success');
      navigate('/orders');
    } catch (err) {
      addToast(`Error: ${err.message}`, 'error');
      console.error(err);
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

        <div className="checkout-right">
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
