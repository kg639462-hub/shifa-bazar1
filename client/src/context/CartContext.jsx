import React, { createContext, useContext, useState, useEffect } from 'react';
import { sampleProducts } from '../data/sampleProducts';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Initial state matching the screenshot: 2 herbal preparations ($28.00 + $34.50 = $62.50)
const initialCartState = [
  {
    ...sampleProducts[0],
    quantity: 1,
  },
  {
    ...sampleProducts[1],
    quantity: 1,
  },
];

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('ash_shifa_cart');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read cart from localStorage', e);
    }
    return initialCartState;
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('ash_shifa_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Could not persist cart to localStorage', e);
    }
  }, [cartItems]);

  const addToCart = (product, qty = 1) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty,
        };
        return updated;
      }
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Calculations
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const shippingFee = 0.0; // Apothecary Cold-pack Shipping: FREE
  const taxAmount = 0.0; // Estimated Botanical Tax: $0.00
  const totalInvestment = subtotal + shippingFee + taxAmount;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        shippingFee,
        taxAmount,
        totalInvestment,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
