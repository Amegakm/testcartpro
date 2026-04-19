import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
      const cartRef = doc(db, 'carts', user.id);
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        setCartItems(cartSnap.data().items || []);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch cart', error);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product) => {
    if (!user) return alert('Log in first!');
    try {
      const cartRef = doc(db, 'carts', user.id);
      const cartSnap = await getDoc(cartRef);
      
      let updatedItems = [];
      if (cartSnap.exists()) {
        const items = cartSnap.data().items || [];
        const existing = items.find(i => i.product_id === product.id);
        if (existing) {
          updatedItems = items.map(i => 
            i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        } else {
          updatedItems = [...items, { ...product, product_id: product.id, quantity: 1 }];
        }
        await updateDoc(cartRef, { items: updatedItems });
      } else {
        updatedItems = [{ ...product, product_id: product.id, quantity: 1 }];
        await setDoc(cartRef, { items: updatedItems });
      }
      
      setCartItems(updatedItems);
      setIsCartOpen(true);
    } catch (e) {
      alert('Failed adding to cart');
      console.error(e);
    }
  };

  const removeFromCart = async (product_id) => {
    if (!user) return;
    try {
      const cartRef = doc(db, 'carts', user.id);
      const cartSnap = await getDoc(cartRef);
      
      if (cartSnap.exists()) {
        const items = cartSnap.data().items || [];
        const updatedItems = items.filter(i => i.product_id !== product_id);
        await updateDoc(cartRef, { items: updatedItems });
        setCartItems(updatedItems);
      }
    } catch (e) {
      alert('Removal failed');
      console.error(e);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    try {
      const cartRef = doc(db, 'carts', user.id);
      await updateDoc(cartRef, { items: [] });
      setCartItems([]);
    } catch (e) {
      console.error('Failed to clear cart', e);
    }
  };

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
