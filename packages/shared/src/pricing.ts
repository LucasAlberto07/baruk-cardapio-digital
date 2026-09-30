import { Extra, CartLineSelection, Product } from "./types";

/** Aceita number, string ou o Decimal do Prisma (qualquer coisa com toString numérico). */
export type PriceLike = number | string | { toString(): string };

export function toCents(value: PriceLike): number {
  return Math.round(Number(typeof value === "number" ? value : value.toString()) * 100);
}

/**
 * Preço de uma unidade em centavos: base + adicionais + bebida.
 * É a única conta de preço do sistema — o cardápio mostra e a API cobra
 * exatamente este valor, então os dois nunca divergem.
 */
export function unitPriceCents({ base, extras = [], drink = null }: {
  base: PriceLike;
  extras?: PriceLike[];
  drink?: PriceLike | null;
}): number {
  let total = toCents(base);
  for (const extra of extras) total += toCents(extra);
  if (drink !== null && drink !== undefined) total += toCents(drink);
  return total;
}

/** Preço de uma unidade em reais, a partir dos objetos já carregados do cardápio. */
export function unitPrice(
  selection: CartLineSelection,
  extrasById: Map<string, Extra>,
  productsById: Map<string, Product>
): number {
  const extras = (selection.extraIds ?? [])
    .map((id) => extrasById.get(id)?.price)
    .filter((price): price is number => price !== undefined);
  const drink = selection.drinkProductId ? productsById.get(selection.drinkProductId)?.price ?? null : null;
  return unitPriceCents({ base: selection.basePrice, extras, drink }) / 100;
}

export function lineTotal(
  selection: CartLineSelection,
  extrasById: Map<string, Extra>,
  productsById: Map<string, Product>
): number {
  return (toCents(unitPrice(selection, extrasById, productsById)) * selection.qty) / 100;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
