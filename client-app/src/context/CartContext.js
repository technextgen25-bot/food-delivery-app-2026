import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [restaurantId, setRestaurantId] = useState(null);
  const [items, setItems] = useState([]); // [{ menuItemId, name, price, quantity }]

  function addItem(item, currentRestaurantId) {
    // Si on change de restaurant, on vide le panier (pas de mix multi-restaurants)
    if (restaurantId && restaurantId !== currentRestaurantId) {
      setItems([{ ...item, quantity: 1 }]);
      setRestaurantId(currentRestaurantId);
      return;
    }

    setRestaurantId(currentRestaurantId);
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function decreaseItem(menuItemId) {
    setItems((prev) =>
      prev
        .map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function clearCart() {
    setItems([]);
    setRestaurantId(null);
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ restaurantId, items, addItem, decreaseItem, clearCart, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
