import { z } from "zod";
import { entityId, optionalText, parseOrThrow, requireRecord, requiredText } from "../../core/validation";

const MAX_ITEMS = 30;
const MAX_QTY = 30;
const MAX_EXTRAS_PER_ITEM = 10;
const INVALID_ORDER = "Pedido inválido: informe cliente, endereço e de 1 a 30 itens.";
const INVALID_ITEM = "Um ou mais itens do pedido são inválidos.";

const qty = z.number().int().min(1).max(MAX_QTY);
const noValue = z.null().optional();

/** Promoção do dia: só id e quantidade; o preço vem do banco. */
const promoItemSchema = z.object({
  promoId: entityId,
  qty,
  productId: z.undefined(),
  extraIds: z.undefined(),
  drinkProductId: noValue,
  slice: noValue,
}).transform(({ promoId, qty }) => ({ kind: "promo" as const, promoId, qty }));

const productItemSchema = z.object({
  productId: entityId,
  qty,
  promoId: z.undefined(),
  extraIds: z.array(entityId).max(MAX_EXTRAS_PER_ITEM)
    .refine((ids) => new Set(ids).size === ids.length, "Adicional repetido.")
    .default([]),
  drinkProductId: entityId.nullish().transform((id) => id ?? null),
  slice: z.enum(["8 fatias", "12 fatias"]).nullish().transform((slice) => slice ?? null),
}).transform((item) => ({ kind: "product" as const, ...item }));

const orderItemSchema = z.union([promoItemSchema, productItemSchema]);

const orderSchema = z.object({
  customerName: requiredText(100),
  address: requiredText(300),
  notes: optionalText(500).optional().transform((notes) => notes || null),
  items: z.array(z.unknown()).min(1).max(MAX_ITEMS),
});

export type PromoItemInput = z.infer<typeof promoItemSchema>;
export type ProductItemInput = z.infer<typeof productItemSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = Omit<z.infer<typeof orderSchema>, "items"> & { items: OrderItemInput[] };

/** Valida o pedido em duas etapas para manter mensagens distintas para o pedido e para os itens. */
export function parseCreateOrder(body: unknown): CreateOrderInput {
  const order = parseOrThrow(orderSchema, requireRecord(body), INVALID_ORDER);
  const items = order.items.map((item) => parseOrThrow(orderItemSchema, item, INVALID_ITEM));
  return { ...order, items };
}
