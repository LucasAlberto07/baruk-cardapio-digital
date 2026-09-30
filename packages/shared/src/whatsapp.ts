import { formatOrderNumber, OrderStatus } from "./orders";
import { formatBRL } from "./pricing";

export const STORE_NAME = "Baruk Pizzaria & Esfiharia";

const BRAZIL_DDI = "55";

/**
 * Normaliza um telefone brasileiro digitado de qualquer jeito ("(11) 91234-5678",
 * "+55 11 91234 5678"...) para só dígitos com DDI: "5511912345678".
 * Aceita celular (DDD + 9 + 8 dígitos) e fixo (DDD + 8 dígitos); devolve null se inválido.
 */
export function normalizeBrazilianPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith(BRAZIL_DDI)) digits = digits.slice(2);

  const isMobile = /^[1-9][1-9]9\d{8}$/.test(digits);
  const isLandline = /^[1-9][1-9][2-5]\d{7}$/.test(digits);
  return isMobile || isLandline ? BRAZIL_DDI + digits : null;
}

/** "5511912345678" → "(11) 91234-5678". */
export function formatPhone(phone: string): string {
  const local = phone.startsWith(BRAZIL_DDI) ? phone.slice(2) : phone;
  const ddd = local.slice(0, 2);
  const number = local.slice(2);
  return `(${ddd}) ${number.slice(0, -4)}-${number.slice(-4)}`;
}

/** Link que abre o WhatsApp com a conversa e a mensagem prontas. */
export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

type NotifiableOrder = { number: number; customerName: string; total: number; address: string };

const firstName = (name: string) => name.trim().split(/\s+/)[0];

/**
 * Mensagem ao cliente em cada etapa do pedido. Único lugar com esses textos:
 * hoje o painel abre o WhatsApp com eles; um envio automático (API oficial)
 * usaria as mesmas mensagens.
 */
const CUSTOMER_MESSAGES: Partial<Record<OrderStatus, (order: NotifiableOrder) => string>> = {
  CONFIRMED: (order) =>
    `Olá, ${firstName(order.customerName)}! Seu pedido ${formatOrderNumber(order.number)} foi *confirmado* ✅\n` +
    `Total: ${formatBRL(order.total)}\n\nAvisaremos por aqui quando entrar em preparo. — ${STORE_NAME}`,
  PREPARING: (order) =>
    `Seu pedido ${formatOrderNumber(order.number)} está *em preparo* 🍕\n\nJá já sai do forno! — ${STORE_NAME}`,
  OUT_FOR_DELIVERY: (order) =>
    `Seu pedido ${formatOrderNumber(order.number)} *saiu para entrega* 🛵\n` +
    `Endereço: ${order.address}\n\nBom apetite! — ${STORE_NAME}`,
};

/** Status em que o cliente é avisado. */
export const CUSTOMER_NOTIFIED_STATUSES = Object.keys(CUSTOMER_MESSAGES) as OrderStatus[];

export function customerStatusMessage(order: NotifiableOrder, status: OrderStatus): string | null {
  return CUSTOMER_MESSAGES[status]?.(order) ?? null;
}
