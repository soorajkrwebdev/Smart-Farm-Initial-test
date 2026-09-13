import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';

export interface FarmerCartGroup {
  farmerId: string;
  farmerName: string;
  items: CartItem[];
  subtotal: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  clearFarmerItems: (farmerId: string) => void;
  totalCount: number;
  totalAmount: number;
  farmerGroups: FarmerCartGroup[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'smartfarm_cart_items_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart to storage:', e);
    }
  }, [items]);

  const addItem = (product: Product, quantity: number = 1) => {
    setItems((prev) => {
      const index = prev.findIndex((i) => i.product.id === product.id);
      if (index >= 0) {
        const updated = [...prev];
        const newQty = updated[index].quantity + quantity;
        updated[index] = {
          ...updated[index],
          quantity: Math.min(newQty, product.quantity_available),
        };
        return updated;
      }
      return [
        ...prev,
        {
          product,
          quantity: Math.min(quantity, product.quantity_available),
          unit_price: product.price,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.product.id !== productId);
      }
      return prev.map((i) => {
        if (i.product.id === productId) {
          return {
            ...i,
            quantity: Math.min(quantity, i.product.quantity_available),
          };
        }
        return i;
      });
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const clearFarmerItems = (farmerId: string) => {
    setItems((prev) => prev.filter((i) => i.product.farmer_id !== farmerId));
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  // Group items by farmer
  const farmerGroups: FarmerCartGroup[] = React.useMemo(() => {
    const map = new Map<string, FarmerCartGroup>();
    for (const item of items) {
      const fId = item.product.farmer_id;
      const fName = item.product.farmer_name || 'Verified Local Farmer';
      if (!map.has(fId)) {
        map.set(fId, {
          farmerId: fId,
          farmerName: fName,
          items: [],
          subtotal: 0,
        });
      }
      const group = map.get(fId)!;
      group.items.push(item);
      group.subtotal += item.quantity * item.unit_price;
    }
    return Array.from(map.values());
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        clearFarmerItems,
        totalCount,
        totalAmount,
        farmerGroups,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
