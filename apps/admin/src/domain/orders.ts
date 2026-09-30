import { customerStatusMessage, nextOrderStatuses, Order, OrderStatus, STORE_TIME_ZONE, whatsappLink } from "@baruk/shared";

/** Texto do botão que leva o pedido a cada status (RECEIVED é o inicial, não tem botão na prática). */
export const STATUS_ACTION_LABELS: Record<OrderStatus, string> = {
  RECEIVED: "Marcar como recebido",
  CONFIRMED: "Confirmar pedido",
  PREPARING: "Iniciar preparo",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  COMPLETED: "Concluir pedido",
};

export type StatusAction = { status: OrderStatus; label: string; primary: boolean };

/**
 * Botões de status de um pedido: a próxima etapa em destaque e, se ela ainda
 * não for a conclusão, um atalho para concluir direto (ex.: retirada no balcão).
 */
export function statusActions(current: OrderStatus): StatusAction[] {
  const [next] = nextOrderStatuses(current);
  if (!next) return [];
  const actions: StatusAction[] = [{ status: next, label: STATUS_ACTION_LABELS[next], primary: true }];
  if (next !== "COMPLETED") actions.push({ status: "COMPLETED", label: STATUS_ACTION_LABELS.COMPLETED, primary: false });
  return actions;
}

/** Link do WhatsApp com o aviso da etapa atual, se o pedido tem telefone e a etapa avisa o cliente. */
export function customerNotificationLink(order: Order): string | null {
  const message = customerStatusMessage(order, order.status);
  return order.customerPhone && message ? whatsappLink(order.customerPhone, message) : null;
}

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: STORE_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Data e hora no fuso da pizzaria, ex.: "30/09/2026, 19:42". */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** Há quanto tempo o pedido chegou, para priorizar a fila: "agora", "há 5 min", "há 1 h 20 min". */
export function elapsedSince(iso: string, now: Date = new Date()): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `há ${hours} h ${rest} min` : `há ${hours} h`;
}

/**
 * Quantos pedidos chegaram desde a última consulta. Os números são sequenciais,
 * então basta comparar o maior número visto. Na primeira consulta não há aviso.
 */
export function countNewOrders(lastSeenNumber: number | null | undefined, latestNumber: number | null): number {
  if (lastSeenNumber === undefined || latestNumber === null) return 0;
  return Math.max(0, latestNumber - (lastSeenNumber ?? 0));
}

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
