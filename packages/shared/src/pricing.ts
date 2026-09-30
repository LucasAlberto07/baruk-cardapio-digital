import { Extra, CartLineSelection, Product } from "./types";

/**
 * Preço de uma unidade do item, já somando adicionais e bebida escolhida.
 * Centralizado aqui para que o cardápio do cliente e qualquer outro
 * consumidor (admin, futuro app) calculem exatamente da mesma forma.
 */
export function unitPrice(
  selection: CartLineSelection,
  extrasById: Map<string, Extra>,
  productsById: Map<string, Product>
): number {
  let total = selection.basePrice;

  for (const extraId of selection.extraIds ?? []) {
    const extra = extrasById.get(extraId);
    if (extra) total += extra.price;
  }

  if (selection.drinkProductId) {
    const drink = productsById.get(selection.drinkProductId);
    if (drink) total += drink.price;
  }

  return total;
}

export function lineTotal(
  selection: CartLineSelection,
  extrasById: Map<string, Extra>,
  productsById: Map<string, Product>
): number {
  return unitPrice(selection, extrasById, productsById) * selection.qty;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
