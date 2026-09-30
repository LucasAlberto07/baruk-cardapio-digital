import { useState } from "react";
import { ApiError, Promo } from "@baruk/shared";
import { env } from "../config/env";
import { ConfirmedOrder, submitOrder } from "../api/orders-api";
import { CartLine, toOrderItems } from "../domain/cart";
import { buildOrderMessage, Customer, validateCustomer, whatsappUrl } from "../domain/whatsapp";
import { useCart } from "../context/CartContext";

type Registration =
  | { status: "confirmed"; order: ConfirmedOrder }
  /** API inacessível: o pedido segue pelo WhatsApp com os valores do carrinho. */
  | { status: "offline" }
  | { status: "rejected"; reason: string };

async function registerOrder(customer: Customer, lines: CartLine[]): Promise<Registration> {
  try {
    const order = await submitOrder({ customerName: customer.name, address: customer.address, notes: customer.notes, items: toOrderItems(lines) });
    return { status: "confirmed", order };
  } catch (cause) {
    if (cause instanceof ApiError) return { status: "rejected", reason: cause.message };
    return { status: "offline" };
  }
}

/** Registra o pedido na API e abre o WhatsApp com a mensagem pronta. */
export function useCheckout(appliedPromo: Promo | null, onSent: () => void) {
  const { lines, totalPrice, clear } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function sendOrder(customer: Customer) {
    const invalidCustomer = validateCustomer(customer);
    setError(invalidCustomer);
    if (invalidCustomer) return;

    setSending(true);
    const registration = await registerOrder(customer, lines);
    setSending(false);

    if (registration.status === "rejected") {
      setError(registration.reason);
      return;
    }

    const confirmed = registration.status === "confirmed" ? registration.order : null;
    const message = buildOrderMessage({
      orderNumber: confirmed?.number ?? null,
      lines: confirmed?.items ?? lines,
      total: confirmed?.total ?? totalPrice,
      promo: appliedPromo,
      customer,
    });
    window.open(whatsappUrl(env.whatsappNumber, message), "_blank");
    clear();
    onSent();
  }

  return { sendOrder, sending, error };
}
