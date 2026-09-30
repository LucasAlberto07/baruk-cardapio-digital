import { useMemo, useState } from "react";
import { Extra, Product, SliceOption } from "@baruk/shared";
import { CartLine, MAX_QTY_PER_LINE } from "../domain/cart";
import { PizzaSelection, pizzaLine, pizzaUnitPrice, SLICE_OPTIONS } from "../domain/cart-lines";

/** Escolhas iniciais: vazias para uma pizza nova, ou as de um item do carrinho sendo editado. */
function initialChoices(line: CartLine | null) {
  if (!line || line.item.kind !== "product") {
    return { qty: 1, slice: SLICE_OPTIONS[0], extraIds: new Set<string>(), drinkId: null };
  }
  return {
    qty: line.qty,
    slice: line.item.slice ?? SLICE_OPTIONS[0],
    extraIds: new Set(line.item.extraIds),
    drinkId: line.item.drinkProductId,
  };
}

/** Estado das escolhas do modal de adicionais; preço e linha do carrinho vêm do domínio. */
export function usePizzaBuilder(product: Product, extras: Extra[], drinks: Product[], editing: CartLine | null = null) {
  const [initial] = useState(() => initialChoices(editing));
  const [qty, setQty] = useState(initial.qty);
  const [slice, setSlice] = useState<SliceOption>(initial.slice);
  const [extraIds, setExtraIds] = useState<Set<string>>(initial.extraIds);
  const [drinkId, setDrinkId] = useState<string | null>(initial.drinkId);

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
