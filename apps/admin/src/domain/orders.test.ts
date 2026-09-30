import { describe, expect, it } from "vitest";
import { Order } from "@baruk/shared";
import { countNewOrders, customerNotificationLink, elapsedSince, formatDateTime, statusActions, totalPages } from "./orders";

describe("formatDateTime", () => {
  it("mostra no fuso de São Paulo", () => {
    expect(formatDateTime("2026-09-30T02:30:00Z")).toBe("29/09/2026, 23:30");
  });
});

describe("elapsedSince", () => {
  const now = new Date("2026-09-30T20:00:00Z");

  it("descreve o tempo de espera do pedido", () => {
    expect(elapsedSince("2026-09-30T19:59:40Z", now)).toBe("agora");
    expect(elapsedSince("2026-09-30T19:55:00Z", now)).toBe("há 5 min");
    expect(elapsedSince("2026-09-30T18:40:00Z", now)).toBe("há 1 h 20 min");
    expect(elapsedSince("2026-09-30T18:00:00Z", now)).toBe("há 2 h");
  });
});

describe("countNewOrders", () => {
  it("não avisa na primeira consulta", () => {
    expect(countNewOrders(undefined, 42)).toBe(0);
  });

  it("conta pelos números sequenciais, mesmo sem nenhum pedido antes", () => {
    expect(countNewOrders(40, 42)).toBe(2);
    expect(countNewOrders(null, 1)).toBe(1);
    expect(countNewOrders(42, 42)).toBe(0);
  });
});

describe("totalPages", () => {
  it("tem ao menos uma página", () => {
    expect(totalPages(0, 20)).toBe(1);
    expect(totalPages(41, 20)).toBe(3);
  });
});

describe("statusActions", () => {
  it("destaca a próxima etapa e oferece concluir direto", () => {
    expect(statusActions("RECEIVED")).toEqual([
      { status: "CONFIRMED", label: "Confirmar pedido", primary: true },
      { status: "COMPLETED", label: "Concluir pedido", primary: false },
    ]);
  });

  it("na última etapa só resta concluir", () => {
    expect(statusActions("OUT_FOR_DELIVERY")).toEqual([{ status: "COMPLETED", label: "Concluir pedido", primary: true }]);
    expect(statusActions("COMPLETED")).toEqual([]);
  });
});

describe("customerNotificationLink", () => {
  const order = { number: 42, customerName: "Ana", customerPhone: "5511912345678", total: 50, address: "Rua A" } as Order;

  it("gera o link com o aviso da etapa atual", () => {
    const link = customerNotificationLink({ ...order, status: "OUT_FOR_DELIVERY" });
    expect(link).toMatch(/^https:\/\/wa\.me\/5511912345678\?text=/);
    expect(decodeURIComponent(link!.split("text=")[1])).toContain("#0042 *saiu para entrega*");
  });

  it("não gera link sem telefone ou em etapa sem aviso", () => {
    expect(customerNotificationLink({ ...order, status: "RECEIVED" })).toBeNull();
    expect(customerNotificationLink({ ...order, status: "CONFIRMED", customerPhone: null })).toBeNull();
  });
});
