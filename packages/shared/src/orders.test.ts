import { describe, expect, it } from "vitest";
import { canChangeOrderStatus, formatOrderNumber, isOrderStatus, nextOrderStatuses } from "./orders";

describe("status do pedido", () => {
  it("só permite avançar no fluxo", () => {
    expect(canChangeOrderStatus("RECEIVED", "PREPARING")).toBe(true);
    expect(canChangeOrderStatus("RECEIVED", "COMPLETED")).toBe(true);
    expect(canChangeOrderStatus("PREPARING", "RECEIVED")).toBe(false);
    expect(canChangeOrderStatus("COMPLETED", "PREPARING")).toBe(false);
    expect(canChangeOrderStatus("PREPARING", "PREPARING")).toBe(false);
  });

  it("lista os próximos status possíveis", () => {
    expect(nextOrderStatuses("RECEIVED")).toEqual(["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "COMPLETED"]);
    expect(nextOrderStatuses("OUT_FOR_DELIVERY")).toEqual(["COMPLETED"]);
    expect(nextOrderStatuses("COMPLETED")).toEqual([]);
  });

  it("valida o valor recebido", () => {
    expect(isOrderStatus("COMPLETED")).toBe(true);
    expect(isOrderStatus("DONE")).toBe(false);
  });
});

describe("formatOrderNumber", () => {
  it("completa com zeros à esquerda", () => {
    expect(formatOrderNumber(42)).toBe("#0042");
    expect(formatOrderNumber(12345)).toBe("#12345");
  });
});
