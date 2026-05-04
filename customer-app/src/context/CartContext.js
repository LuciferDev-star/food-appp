import React, { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i._id === action.item._id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i._id === action.item._id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case 'REMOVE_ITEM': {
      const existing = state.items.find(i => i._id === action.id);
      if (existing && existing.quantity > 1) {
        return {
          ...state,
          items: state.items.map(i =>
            i._id === action.id ? { ...i, quantity: i.quantity - 1 } : i
          ),
        };
      }
      return { ...state, items: state.items.filter(i => i._id !== action.id) };
    }
    case 'CLEAR_CART':
      return { items: [] };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const total = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart: state.items, total, count, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
