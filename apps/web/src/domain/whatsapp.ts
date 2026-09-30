import { Promo, formatBRL, formatOrderNumber, toCents } from "@baruk/shared";

export type Customer = { name: string; address: string; notes: string };
export type MessageLine = { label: string; qty: number; unitPrice: number };

const STORE_NAME = "Baruk Pizzaria & Esfiharia";

/** Valida os dados de entrega; devolve a mensagem de erro ou null. */
export function validateCustomer(customer: Customer): string | null {
  if (!customer.name.trim() || !customer.address.trim()) return "Informe seu nome e o endereço de entrega.";
  return null;
}

function formatLine({ label, qty, unitPrice }: MessageLine): string {
  return `• ${qty}x ${label} — ${formatBRL((toCents(unitPrice) * qty) / 100)}`;
}

export function buildOrderMessage({ orderNumber = null, lines, total, promo, customer }: {
  /** Presente quando a API registrou o pedido; ausente se ela estava fora do ar. */
  orderNumber?: number | null;
  lines: MessageLine[];
  total: number;
  promo: Promo | null;
  customer: Customer;
}): string {
  const title = orderNumber === null ? "Novo pedido" : `Novo pedido ${formatOrderNumber(orderNumber)}`;
  let message = `*${title} — ${STORE_NAME}*\n\n${lines.map(formatLine).join("\n")}\n\n*Total:* ${formatBRL(total)}`;
  if (promo) message += `\n*Promoção:* ${promo.label} — ${promo.title} (${promo.description})`;
  message += `\n\n*Nome:* ${customer.name}\n*Endereço:* ${customer.address}`;
  if (customer.notes) message += `\n*Obs:* ${customer.notes}`;
  return message;
}

export function whatsappUrl(phoneNumber: string, message: string): string {
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
