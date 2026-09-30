import { Order, OrderListResponse, OrderStatus, OrderView } from "@baruk/shared";
import { http } from "./http";

export type OrderListQuery = { view: OrderView; search?: string; page?: number; pageSize?: number };

function toQueryString(query: OrderListQuery): string {
  const params = new URLSearchParams({ view: query.view });
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  return params.toString();
}

export const ordersApi = {
  list: (query: OrderListQuery) => http.get<OrderListResponse>(`/api/orders?${toQueryString(query)}`),
  get: (id: string) => http.get<Order>(`/api/orders/${id}`),
  changeStatus: (id: string, status: OrderStatus) => http.patch<Order>(`/api/orders/${id}/status`, { status }),
};
