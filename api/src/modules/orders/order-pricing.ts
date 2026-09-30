import { Extra, isDrinkCategory, unitPriceCents } from "@baruk/shared";
import { ValidationError } from "../../core/errors";
import { ProductWithCategory } from "../products/products.repository";
import { PromoRecord } from "../promos/promos.repository";
import { OrderItemInput, ProductItemInput, PromoItemInput } from "./orders.schemas";

/** Itens do cardápio referenciados pelo pedido, já carregados do banco. */
export type OrderCatalog = {
  products: Map<string, ProductWithCategory>;
  extras: Map<string, Extra>;
  promos: Map<string, PromoRecord>;
};

export type PricedOrderItem = { label: string; qty: number; unitPrice: number };
export type PricedOrder = { items: PricedOrderItem[]; total: number };

const MAX_TOTAL_CENTS = 9_999_999_999;

/**
 * Regras de negócio do pedido, sem banco nem HTTP:
 * disponibilidade, promoção do dia, combinações válidas e preço em centavos.
 */
export function priceOrder(items: OrderItemInput[], catalog: OrderCatalog, today: number): PricedOrder {
  assertAllAvailable(items, catalog);
  assertPromosAvailableToday(items, catalog, today);
  assertValidCombinations(items, catalog);

  const pricedItems = items.map((item) => (item.kind === "promo" ? pricePromoItem(item, catalog) : priceProductItem(item, catalog)));
  const totalCents = pricedItems.reduce((sum, item) => sum + item.unitCents * item.qty, 0);
  if (totalCents > MAX_TOTAL_CENTS) throw new ValidationError("O total do pedido ultrapassa o limite permitido.");

  return {
    items: pricedItems.map(({ unitCents, ...item }) => ({ ...item, unitPrice: unitCents / 100 })),
    total: totalCents / 100,
  };
}

/** Todos os ids que o pedido referencia, para o service buscar no banco de uma vez. */
export function referencedIds(items: OrderItemInput[]) {
  const productItems = items.filter(isProductItem);
  return {
    productIds: unique(productItems.flatMap((item) => (item.drinkProductId ? [item.productId, item.drinkProductId] : [item.productId]))),
    extraIds: unique(productItems.flatMap((item) => item.extraIds)),
    promoIds: unique(items.filter(isPromoItem).map((item) => item.promoId)),
  };
}

function assertAllAvailable(items: OrderItemInput[], catalog: OrderCatalog) {
  const { productIds, extraIds, promoIds } = referencedIds(items);
  const allFound = productIds.every((id) => catalog.products.has(id)) &&
    extraIds.every((id) => catalog.extras.has(id)) &&
    promoIds.every((id) => catalog.promos.has(id));
  if (!allFound) {
    throw new ValidationError("O cardápio mudou ou contém uma opção indisponível. Atualize a página e tente novamente.");
  }
}

function assertPromosAvailableToday(items: OrderItemInput[], catalog: OrderCatalog, today: number) {
  const unavailable = items.filter(isPromoItem).some((item) => {
    const promo = catalog.promos.get(item.promoId)!;
    return promo.price === null || promo.weekday !== today;
  });
  if (unavailable) throw new ValidationError("Essa promoção não está disponível hoje.");
}

/** Bebida só acompanha pizza; um item bebida não leva adicionais nem outra bebida. */
function assertValidCombinations(items: OrderItemInput[], catalog: OrderCatalog) {
  const invalid = items.filter(isProductItem).some((item) => {
    const productIsDrink = isDrinkCategory(catalog.products.get(item.productId)!.category);
    const drink = item.drinkProductId ? catalog.products.get(item.drinkProductId)! : null;
    if (productIsDrink) return item.extraIds.length > 0 || drink !== null;
    return drink !== null && !isDrinkCategory(drink.category);
  });
  if (invalid) throw new ValidationError("Uma ou mais combinações de adicionais/bebidas são inválidas.");
}

function pricePromoItem(item: PromoItemInput, catalog: OrderCatalog) {
  const promo = catalog.promos.get(item.promoId)!;
  return { label: `${promo.title} (${promo.label})`, qty: item.qty, unitCents: unitPriceCents({ base: promo.price! }) };
}

function priceProductItem(item: ProductItemInput, catalog: OrderCatalog) {
  const product = catalog.products.get(item.productId)!;
  const drink = item.drinkProductId ? catalog.products.get(item.drinkProductId)! : null;
  const extras = item.extraIds.map((id) => catalog.extras.get(id)!);

  const baseLabel = isDrinkCategory(product.category)
    ? product.name
    : `Pizza ${product.name}${item.slice ? ` (${item.slice})` : ""}`;
  const label = [baseLabel, ...extras.map((extra) => extra.name), ...(drink ? [drink.name] : [])].join(" + ");

  return {
    label,
    qty: item.qty,
    unitCents: unitPriceCents({ base: product.price, extras: extras.map((extra) => extra.price), drink: drink?.price ?? null }),
  };
}

const isPromoItem = (item: OrderItemInput): item is PromoItemInput => item.kind === "promo";
const isProductItem = (item: OrderItemInput): item is ProductItemInput => item.kind === "product";
const unique = <T>(values: T[]) => [...new Set(values)];
