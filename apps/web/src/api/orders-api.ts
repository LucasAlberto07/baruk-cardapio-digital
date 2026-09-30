import { OrderPayload } from "@baruk/shared";
import { http } from "./http";

/** Pedido como a API o registrou: preços e rótulos calculados no servidor. */
export type ConfirmedOrder = {
  total: number;
  items: { label: string; qty: number; unitPrice: number }[];
};

export function submitOrder(payload: OrderPayload): Promise<ConfirmedOrder> {
  return http.post("/api/orders", payload);
}
