import { z } from "zod";
import { normalizeBrazilianPhone, ORDER_STATUSES, OrderStatus } from "@baruk/shared";
import { ValidationError } from "../../core/errors";
import { entityId, optionalText, parseOrThrow, requireRecord, requiredText } from "../../core/validation";
import { OrderSearch } from "./orders.repository";

const MAX_ITEMS = 30;
const MAX_QTY = 30;
const MAX_EXTRAS_PER_ITEM = 10;
const INVALID_ORDER = "Pedido inválido: informe cliente, endereço e de 1 a 30 itens.";
const INVALID_PHONE = "Informe um telefone válido com DDD, ex.: (11) 91234-5678.";
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
  // Validado à parte para o cliente receber uma mensagem específica sobre o telefone.
  customerPhone: z.unknown(),
  address: requiredText(300),
  notes: optionalText(500).optional().transform((notes) => notes || null),
  items: z.array(z.unknown()).min(1).max(MAX_ITEMS),
});

export type PromoItemInput = z.infer<typeof promoItemSchema>;
export type ProductItemInput = z.infer<typeof productItemSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = Omit<z.infer<typeof orderSchema>, "items" | "customerPhone"> & {
  /** Só dígitos, com DDI (ex.: "5511912345678"). */
  customerPhone: string;
  items: OrderItemInput[];
};

/** Valida o pedido em duas etapas para manter mensagens distintas para o pedido e para os itens. */
export function parseCreateOrder(body: unknown): CreateOrderInput {
  const order = parseOrThrow(orderSchema, requireRecord(body), INVALID_ORDER);
  const customerPhone = typeof order.customerPhone === "string" ? normalizeBrazilianPhone(order.customerPhone) : null;
  if (!customerPhone) throw new ValidationError(INVALID_PHONE);
  const items = order.items.map((item) => parseOrThrow(orderItemSchema, item, INVALID_ITEM));
  return { ...order, customerPhone, items };
}

export const MAX_PAGE_SIZE = 50;

/** "#42", "0042" ou "42" buscam pelo número do pedido; qualquer outro texto busca pelo nome do cliente. */
const searchSchema = z.string().max(100).transform((text): OrderSearch | null => {
  const term = text.trim();
  if (!term) return null;
  const numberMatch = /^#?(\d{1,9})$/.exec(term);
  return numberMatch ? { number: Number(numberMatch[1]) } : { customerName: term };
});

const listOrdersSchema = z.object({
  view: z.enum(["open", "history"]).default("open"),
  search: searchSchema.optional().transform((search) => search ?? null),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
});

export type ListOrdersInput = z.infer<typeof listOrdersSchema>;

export function parseListOrdersQuery(query: unknown): ListOrdersInput {
  return parseOrThrow(listOrdersSchema, query, "Filtro de pedidos inválido.");
}

const statusChangeSchema = z.object({
  status: z.enum(ORDER_STATUSES, { message: `Status inválido. Use: ${ORDER_STATUSES.join(", ")}.` }),
});

export function parseStatusChange(body: unknown): OrderStatus {
  return parseOrThrow(statusChangeSchema, requireRecord(body)).status;
}
