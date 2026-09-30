import { useCallback, useEffect, useRef, useState } from "react";
import { ordersApi } from "../api/orders-api";
import { countNewOrders } from "../domain/orders";
import { usePolling } from "./usePolling";
import { ORDERS_REFRESH_MS } from "./useOrders";

const PAGE_TITLE = "Baruk — Painel do Lojista";

/**
 * Vigia a chegada de pedidos em qualquer tela do painel: acumula quantos chegaram
 * até o lojista ver, e mostra a contagem no título da aba.
 */
export function useNewOrderAlert() {
  const [newCount, setNewCount] = useState(0);
  const [latestNumber, setLatestNumber] = useState<number | null>(null);
  // undefined até a primeira consulta, para não avisar dos pedidos que já existiam.
  const lastSeenNumber = useRef<number | null | undefined>(undefined);

  const check = useCallback(async () => {
    try {
      const { latestOrderNumber } = await ordersApi.list({ view: "open", pageSize: 1 });
      const arrived = countNewOrders(lastSeenNumber.current, latestOrderNumber);
      lastSeenNumber.current = latestOrderNumber;
      if (arrived > 0) {
        setNewCount((current) => current + arrived);
        setLatestNumber(latestOrderNumber);
      }
    } catch {
      // Falha pontual de rede: a próxima verificação tenta de novo.
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  usePolling(() => void check(), ORDERS_REFRESH_MS);

  useEffect(() => {
    document.title = newCount > 0 ? `(${newCount}) ${PAGE_TITLE}` : PAGE_TITLE;
  }, [newCount]);

  return { newCount, latestNumber, dismiss: () => setNewCount(0) };
}
