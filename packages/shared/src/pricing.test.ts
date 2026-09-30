import { describe, expect, it } from "vitest";
import { lineTotal, toCents, unitPrice, unitPriceCents } from "./pricing";
import { isDrinkCategory, weekdayInSaoPaulo } from "./menu-rules";

describe("toCents", () => {
  it("arredonda erros de ponto flutuante", () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(79.99)).toBe(7999);
  });

  it("aceita string e objetos tipo Decimal do Prisma", () => {
    expect(toCents("57.50")).toBe(5750);
    expect(toCents({ toString: () => "64.00" })).toBe(6400);
  });
});

describe("unitPriceCents", () => {
  it("soma base, adicionais e bebida em centavos", () => {
    expect(unitPriceCents({ base: 79.99, extras: [6, 6], drink: 14 })).toBe(10599);
  });

  it("funciona sem adicionais nem bebida", () => {
    expect(unitPriceCents({ base: 50 })).toBe(5000);
  });
});

describe("unitPrice / lineTotal", () => {
  const extras = new Map([["e1", { id: "e1", name: "Alho", price: 6 }]]);
  const products = new Map([["d1", { id: "d1", categoryId: "c", name: "Sprite", description: "", price: 14, active: true }]]);
  const selection = { productId: "p1", productName: "Costela", basePrice: 79.99, qty: 3, extraIds: ["e1"], drinkProductId: "d1" };

  it("usa os mesmos centavos da API", () => {
    expect(unitPrice(selection, extras, products)).toBe(99.99);
    expect(lineTotal(selection, extras, products)).toBe(299.97);
  });
});

describe("regras do cardápio", () => {
  it("identifica a categoria de bebidas pelo slug", () => {
    expect(isDrinkCategory({ slug: "bebidas" })).toBe(true);
    expect(isDrinkCategory({ slug: "doces" })).toBe(false);
    expect(isDrinkCategory(null)).toBe(false);
  });

  it("calcula o dia da semana no fuso de São Paulo", () => {
    // 2026-09-30 (quarta) 02:00 UTC ainda é terça 23:00 em São Paulo.
    expect(weekdayInSaoPaulo(new Date("2026-09-30T02:00:00Z"))).toBe(2);
    expect(weekdayInSaoPaulo(new Date("2026-09-30T15:00:00Z"))).toBe(3);
  });
});
