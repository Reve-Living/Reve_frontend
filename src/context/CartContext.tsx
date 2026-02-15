import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Product } from '@/lib/types';

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
  selectedVariants?: Record<string, string>;
  fabric?: string;
  dimension?: string;
  dimension_details?: string;
  extras_total?: number;
  include_dimension?: boolean;
  unit_price?: number;
  mattress_id?: number | null;
  mattress_name?: string | null;
  mattress_price?: number | null;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; size: string; color: string; variantsKey: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; size: string; color: string; variantsKey: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' };

const getVariantsKey = (
  item: Pick<
    CartItem,
    | 'selectedVariants'
    | 'fabric'
    | 'dimension'
    | 'dimension_details'
    | 'extras_total'
    | 'include_dimension'
    | 'mattress_id'
  >
): string => {
  return JSON.stringify({
    selectedVariants: item.selectedVariants || {},
    fabric: item.fabric || '',
    dimension: item.dimension || '',
    dimension_details: item.dimension_details || '',
    extras_total: item.extras_total || 0,
    include_dimension: item.include_dimension !== false,
    mattress_id: item.mattress_id || null,
  });
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        item =>
          item.product.id === action.payload.product.id &&
          item.size === action.payload.size &&
          item.color === action.payload.color &&
          getVariantsKey(item) === getVariantsKey(action.payload)
      );

      if (existingIndex > -1) {
        const newItems = [...state.items];
        newItems[existingIndex].quantity += action.payload.quantity;
        return { ...state, items: newItems, isOpen: true };
      }

      return { ...state, items: [...state.items, action.payload], isOpen: true };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          item =>
            !(
              item.product.id === action.payload.productId &&
              item.size === action.payload.size &&
              item.color === action.payload.color &&
              getVariantsKey(item) === action.payload.variantsKey
            )
        ),
      };

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item => {
        if (
          item.product.id === action.payload.productId &&
          item.size === action.payload.size &&
          item.color === action.payload.color &&
          getVariantsKey(item) === action.payload.variantsKey
        ) {
          return { ...item, quantity: action.payload.quantity };
        }
        return item;
      });
      return { ...state, items: newItems };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    case 'OPEN_CART':
      return { ...state, isOpen: true };

    case 'CLOSE_CART':
      return { ...state, isOpen: false };

    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string, color: string, variantsKey: string) => void;
  updateQuantity: (productId: string, size: string, color: string, variantsKey: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });

  const addItem = (item: CartItem) => dispatch({ type: 'ADD_ITEM', payload: item });
  const removeItem = (productId: string, size: string, color: string, variantsKey: string) =>
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, size, color, variantsKey } });
  const updateQuantity = (productId: string, size: string, color: string, variantsKey: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, size, color, variantsKey, quantity } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });
  const toggleCart = () => dispatch({ type: 'TOGGLE_CART' });
  const openCart = () => dispatch({ type: 'OPEN_CART' });
  const closeCart = () => dispatch({ type: 'CLOSE_CART' });

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce((sum, item) => {
    const unit = item.unit_price ?? item.product.price + (item.extras_total || 0);
    return sum + unit * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
