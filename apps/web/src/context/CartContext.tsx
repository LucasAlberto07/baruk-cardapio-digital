import { createContext, ReactNode, useContext, useMemo, useReducer } from "react";
import { CartLine, cartReducer, cartTotals } from "../domain/cart";

type CartContextValue = {
  lines: CartLine[];
  totalItems: number;
  totalPrice: number;
  addLine: (line: CartLine) => void;
  changeQty: (key: string, delta: number) => void;
  removeLine: (key: string) => void;
  replaceLine: (key: string, line: CartLine) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Só guarda o estado; as regras do carrinho ficam em domain/cart.ts. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(cartReducer, []);

  const value = useMemo<CartContextValue>(() => ({
    lines,
    ...cartTotals(lines),
    addLine: (line) => dispatch({ type: "add", line }),
    changeQty: (key, delta) => dispatch({ type: "changeQty", key, delta }),
    removeLine: (key) => dispatch({ type: "remove", key }),
    replaceLine: (key, line) => dispatch({ type: "replace", key, line }),
    clear: () => dispatch({ type: "clear" }),
  }), [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return context;
}
