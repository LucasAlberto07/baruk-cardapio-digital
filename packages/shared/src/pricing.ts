import { Extra, CartLineSelection, Product } from "./types";

/** Aceita number, string ou o Decimal do Prisma (qualquer coisa com toString numérico). */
export type PriceLike = number | string | { toString(): string };

export const MIN_PRICE = 0.01;
export const MAX_PRICE = 9999.99;

/** Preço aceito no cadastro: entre R$ 0,01 e R$ 9.999,99, com no máximo duas casas decimais. */
export function isValidPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) &&
    value >= MIN_PRICE && value <= MAX_PRICE &&
    Math.abs(Math.round(value * 100) - value * 100) < 1e-8;
}

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
