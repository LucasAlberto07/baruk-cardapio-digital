import { describe, expect, it } from "vitest";
import { countNewOrders, elapsedSince, formatDateTime, totalPages } from "./orders";

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
