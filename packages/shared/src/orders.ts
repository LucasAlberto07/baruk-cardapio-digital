/** Ciclo de vida de um pedido. A ordem do array é a ordem do fluxo. */
export const ORDER_STATUSES = ["RECEIVED", "PREPARING", "COMPLETED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  RECEIVED: "Recebido",
  PREPARING: "Em preparo",
  COMPLETED: "Concluído",
};

/** Pedidos em aberto aparecem na fila do painel; concluídos vão para o histórico. */
export const OPEN_ORDER_STATUSES: OrderStatus[] = ["RECEIVED", "PREPARING"];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

/** O pedido só avança (Recebido → Em preparo → Concluído); pode pular etapas, nunca voltar. */
export function canChangeOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUSES.indexOf(to) > ORDER_STATUSES.indexOf(from);
}

/** Próximos status possíveis a partir do atual. */
export function nextOrderStatuses(current: OrderStatus): OrderStatus[] {
  return ORDER_STATUSES.filter((status) => canChangeOrderStatus(current, status));
}

/** Número exibido ao cliente e ao lojista, ex.: 42 → "#0042". */
export function formatOrderNumber(orderNumber: number): string {
  return "#" + String(orderNumber).padStart(4, "0");
}

export type OrderItem = { id: string; orderId: string; label: string; qty: number; unitPrice: number };

export type Order = {
  id: string;
  number: number;
  status: OrderStatus;
  customerName: string;
  address: string;
  notes: string | null;
  total: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  items: OrderItem[];
};

/** Filas do painel: pedidos em aberto ou histórico de concluídos. */
export type OrderView = "open" | "history";

export type OrderListResponse = {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
  /** Maior número de pedido já criado; se aumentar entre consultas, chegaram pedidos novos. */
  latestOrderNumber: number | null;
};
