import { Extra, Product, Promo, SliceOption, unitPriceCents } from "@baruk/shared";
import { CartLine } from "./cart";

export const SLICE_OPTIONS: SliceOption[] = ["8 fatias", "12 fatias"];

export type PizzaSelection = {
  product: Product;
  slice: SliceOption;
  extras: Extra[];
  drink: Product | null;
  qty: number;
};

/** Preço unitário da pizza montada — mesma conta que a API usa para cobrar. */
export function pizzaUnitPrice({ product, extras, drink }: Pick<PizzaSelection, "product" | "extras" | "drink">): number {
  return unitPriceCents({ base: product.price, extras: extras.map((extra) => extra.price), drink: drink?.price ?? null }) / 100;
}

export function pizzaLine(selection: PizzaSelection): CartLine {
  const { product, slice, drink, qty } = selection;
  const extraNames = selection.extras.map((extra) => extra.name).sort();

  let label = `Pizza ${product.name} (${slice})`;
  if (extraNames.length) label += " + " + extraNames.join(", ");
  if (drink) label += " + " + drink.name;

  return {
    key: ["pizza", product.id, slice, extraNames.join(","), drink?.id ?? "none"].join(":"),
    label,
    unitPrice: pizzaUnitPrice(selection),
    qty,
    item: { kind: "product", productId: product.id, extraIds: selection.extras.map((extra) => extra.id), drinkProductId: drink?.id ?? null, slice },
  };
}

export function drinkLine(drink: Product): CartLine {
  return {
    key: "bebida:" + drink.id,
    label: drink.name,
    unitPrice: drink.price,
    qty: 1,
    item: { kind: "product", productId: drink.id, extraIds: [], drinkProductId: null, slice: null },
  };
}

/** Só promoções com preço viram item do carrinho. */
export function promoLine(promo: Promo & { price: number }): CartLine {
  return {
    key: "promo:" + promo.id,
    label: `${promo.title} (${promo.label})`,
    unitPrice: promo.price,
    qty: 1,
    item: { kind: "promo", promoId: promo.id },
  };
}
