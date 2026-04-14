import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

export default function CartPanel() {
  const { user } = useContext(AuthContext);
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, cartTotal, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  const handleProceed = () => {
    if (!user) return navigate('/login');
    if (cartItems.length === 0) return alert('Cart is empty!');
    setIsCartOpen(false);
    navigate('/checkout');
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
          <button className="btn btn-green btn-full" onClick={handleProceed}>Proceed to Checkout →</button>
        </div>
      </div>
    </>
  );
}
