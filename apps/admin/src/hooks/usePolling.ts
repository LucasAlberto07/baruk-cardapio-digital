import { useEffect, useRef } from "react";

/**
 * Executa `task` a cada `intervalMs` enquanto a aba estiver visível, e logo ao
 * voltar para ela. Assim pedidos novos aparecem sem recarregar a página.
 */
export function usePolling(task: () => void, intervalMs: number, enabled = true) {
  const latestTask = useRef(task);
  latestTask.current = task;

  useEffect(() => {
    if (!enabled) return;
    const run = () => {
      if (document.visibilityState === "visible") latestTask.current();
    };
    const timer = window.setInterval(run, intervalMs);
    document.addEventListener("visibilitychange", run);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
    };
  }, [intervalMs, enabled]);
}
