import { useCallback, useEffect, useState } from "react";
import { errorMessage, formatOrderNumber, ORDER_STATUS_LABELS, Order, OrderStatus, OrderView } from "@baruk/shared";
import { ordersApi } from "../api/orders-api";
import { Feedback, failure, success } from "../domain/feedback";
import { usePolling } from "./usePolling";

export const ORDERS_PAGE_SIZE = 20;
export const ORDERS_REFRESH_MS = 10_000;

/** Fila de pedidos em aberto ou histórico, atualizados automaticamente. */
export function useOrders(view: OrderView) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await ordersApi.list({ view, search, page, pageSize: ORDERS_PAGE_SIZE });
      setOrders(result.items);
      setTotal(result.total);
    } catch (cause) {
      setFeedback(failure(errorMessage(cause, "Não foi possível carregar os pedidos.")));
    } finally {
      setLoading(false);
    }
  }, [view, search, page]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  usePolling(() => void refresh(), ORDERS_REFRESH_MS);

  async function changeStatus(order: Order, status: OrderStatus) {
    setFeedback(null);
    try {
      await ordersApi.changeStatus(order.id, status);
      setFeedback(success(`Pedido ${formatOrderNumber(order.number)}: ${ORDER_STATUS_LABELS[status]}.`));
      await refresh();
    } catch (cause) {
      setFeedback(failure(errorMessage(cause, "Não foi possível atualizar o pedido.")));
    }
  }

  function changeSearch(text: string) {
    setSearch(text);
    setPage(1);
  }

  return { orders, total, page, setPage, search, changeSearch, loading, feedback, changeStatus };
}
