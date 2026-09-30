import { useMemo, useState } from "react";
import { Extra, Product, SliceOption } from "@baruk/shared";
import { MAX_QTY_PER_LINE } from "../domain/cart";
import { PizzaSelection, pizzaLine, pizzaUnitPrice, SLICE_OPTIONS } from "../domain/cart-lines";

/** Estado das escolhas do modal de adicionais; preço e linha do carrinho vêm do domínio. */
export function usePizzaBuilder(product: Product, extras: Extra[], drinks: Product[]) {
  const [qty, setQty] = useState(1);
  const [slice, setSlice] = useState<SliceOption>(SLICE_OPTIONS[0]);
  const [extraIds, setExtraIds] = useState<Set<string>>(new Set());
  const [drinkId, setDrinkId] = useState<string | null>(null);

  const selection: PizzaSelection = useMemo(() => ({
    product,
    slice,
    qty,
    extras: extras.filter((extra) => extraIds.has(extra.id)),
    drink: drinks.find((drink) => drink.id === drinkId) ?? null,
  }), [product, slice, qty, extras, extraIds, drinks, drinkId]);

  const unitPrice = pizzaUnitPrice(selection);

  function toggleExtra(id: string) {
    setExtraIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return {
    slice,
    setSlice,
    isExtraSelected: (id: string) => extraIds.has(id),
    toggleExtra,
    drinkId,
    setDrinkId,
    qty,
    increaseQty: () => setQty((current) => Math.min(MAX_QTY_PER_LINE, current + 1)),
    decreaseQty: () => setQty((current) => Math.max(1, current - 1)),
    totalPrice: (Math.round(unitPrice * 100) * qty) / 100,
    toCartLine: () => pizzaLine(selection),
  };
}
