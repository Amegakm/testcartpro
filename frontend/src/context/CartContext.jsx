import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    try {
      const data = await apiFetch('/cart');
      setCartItems(data);
    } catch (error) {
      console.error('Failed to fetch cart', error);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product_id) => {
    if (!user) return alert("Log in first!");
    try {
      await apiFetch('/cart/add', {
        method: 'POST',
        body: JSON.stringify({ product_id, quantity: 1 })
      });
      fetchCart();
      setIsCartOpen(true);
    } catch (e) {
      alert('Failed adding to cart');
      console.error(e);
    }
  };

  const removeFromCart = async (product_id) => {
    if (!user) return;
    try {
      await apiFetch('/cart/remove', {
        method: 'POST',
        body: JSON.stringify({ product_id })
      });
      fetchCart();
    } catch (e) {
      alert('Removal failed');
      console.error(e);
    }
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, addToCart, removeFromCart, clearCart, 
      fetchCart, cartTotal, totalCount, 
      isCartOpen, setIsCartOpen 
    }}>
      {children}
    </CartContext.Provider>
  );
};
