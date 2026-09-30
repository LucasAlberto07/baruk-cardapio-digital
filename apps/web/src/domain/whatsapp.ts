import { Promo, STORE_NAME, formatBRL, formatOrderNumber, formatPhone, normalizeBrazilianPhone, toCents } from "@baruk/shared";

export type Customer = { name: string; phone: string; address: string; notes: string };
export type MessageLine = { label: string; qty: number; unitPrice: number };

/** Valida os dados de entrega; devolve a mensagem de erro ou null. */
export function validateCustomer(customer: Customer): string | null {
  if (!customer.name.trim() || !customer.address.trim()) return "Informe seu nome e o endereço de entrega.";
  if (!normalizeBrazilianPhone(customer.phone)) return "Informe um telefone válido com DDD, ex.: (11) 91234-5678.";
  return null;
}

function formatLine({ label, qty, unitPrice }: MessageLine): string {
  return `• ${qty}x ${label} — ${formatBRL((toCents(unitPrice) * qty) / 100)}`;
}

/** Mensagem que o cliente envia para a pizzaria ao fechar o pedido. */
export function buildOrderMessage({ orderNumber = null, lines, total, promo, customer }: {
  /** Presente quando a API registrou o pedido; ausente se ela estava fora do ar. */
  orderNumber?: number | null;
  lines: MessageLine[];
  total: number;
  promo: Promo | null;
  customer: Customer;
}): string {
  const title = orderNumber === null ? "Novo pedido" : `Novo pedido ${formatOrderNumber(orderNumber)}`;
  const phone = normalizeBrazilianPhone(customer.phone);

  let message = `*${title} — ${STORE_NAME}*\n\n${lines.map(formatLine).join("\n")}\n\n*Total:* ${formatBRL(total)}`;
  if (promo) message += `\n*Promoção:* ${promo.label} — ${promo.title} (${promo.description})`;
  message += `\n\n*Nome:* ${customer.name}`;
  if (phone) message += `\n*Telefone:* ${formatPhone(phone)}`;
  message += `\n*Endereço:* ${customer.address}`;
  if (customer.notes) message += `\n*Obs:* ${customer.notes}`;
  return message;
}
