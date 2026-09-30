import { describe, expect, it } from "vitest";
import { slugify, validPrice, validText } from "./validation";

describe("validPrice", () => {
  it("aceita valores entre R$ 0,01 e R$ 9.999,99 com até duas casas", () => {
    expect(validPrice(0.01)).toBe(true);
    expect(validPrice(79.99)).toBe(true);
    expect(validPrice(9999.99)).toBe(true);
  });

  it("rejeita zero, negativos, excesso de casas e não-números", () => {
    expect(validPrice(0)).toBe(false);
    expect(validPrice(-1)).toBe(false);
    expect(validPrice(10000)).toBe(false);
    expect(validPrice(1.001)).toBe(false);
    expect(validPrice("10")).toBe(false);
    expect(validPrice(Number.NaN)).toBe(false);
  });

  it("aceita zero só quando permitido", () => {
    expect(validPrice(0, true)).toBe(true);
  });
});

describe("validText", () => {
  it("exige texto não vazio dentro do limite", () => {
    expect(validText("Calabresa", 100)).toBe(true);
    expect(validText("   ", 100)).toBe(false);
    expect(validText("", 100, true)).toBe(true);
    expect(validText("a".repeat(101), 100)).toBe(false);
    expect(validText(42, 100)).toBe(false);
  });
});

describe("slugify", () => {
  it("remove acentos e símbolos", () => {
    expect(slugify("Pizzas Doces & Especiais")).toBe("pizzas-doces-especiais");
    expect(slugify("Promoções")).toBe("promocoes");
    expect(slugify("!!!")).toBe("");
  });
});
