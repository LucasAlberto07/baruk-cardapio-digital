import { MenuResponse, OrderPayload } from "@baruk/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export async function fetchMenu(): Promise<MenuResponse> {
  const res = await fetch(`${API_URL}/api/menu`);
  if (!res.ok) throw new Error("Não foi possível carregar o cardápio.");
  return res.json();
}

export async function submitOrder(payload: OrderPayload) {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const result = await res.json().catch(() => ({}));
    throw new ApiError(result.error ?? "Não foi possível registrar o pedido.", res.status);
  }
  return res.json();
}
