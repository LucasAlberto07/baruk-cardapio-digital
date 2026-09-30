import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type CartLine = {
  key: string;
  label: string;
  unitPrice: number;
  qty: number;
  productId: string;
  extraIds?: string[];
  drinkProductId?: string | null;
  slice?: "8 fatias" | "12 fatias";
};

type CartSelection = Pick<CartLine, "productId" | "extraIds" | "drinkProductId" | "slice">;

type CartContextValue = {
  lines: CartLine[];
  addLine: (key: string, label: string, unitPrice: number, qty?: number, selection?: CartSelection) => void;
  changeQty: (key: string, delta: number) => void;
  totalItems: number;
  totalPrice: number;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  function addLine(key: string, label: string, unitPrice: number, qty = 1, selection?: CartSelection) {
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l));
      }
      return [...prev, { key, label, unitPrice, qty, ...(selection ?? { productId: key }) }];
    });
  }

  function changeQty(key: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function clear() {
    setLines([]);
  }

  const totalItems = useMemo(() => lines.reduce((a, l) => a + l.qty, 0), [lines]);
  const totalPrice = useMemo(() => lines.reduce((a, l) => a + Math.round(l.qty * l.unitPrice * 100), 0) / 100, [lines]);

  return (
    <CartContext.Provider value={{ lines, addLine, changeQty, totalItems, totalPrice, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}
