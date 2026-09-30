import { describe, expect, it } from "vitest";
import { groupByCategory, parsePriceInput, validateProductForm } from "./products";
import type { ProductWithCategory } from "../api/products-api";

describe("parsePriceInput", () => {
  it("aceita preços válidos digitados no input", () => {
    expect(parsePriceInput("79.99")).toBe(79.99);
    expect(parsePriceInput("0.01")).toBe(0.01);
  });

  it("rejeita vazio, zero, acima do limite e mais de duas casas", () => {
    for (const text of ["", "0", "10000", "1.001", "abc"]) expect(parsePriceInput(text)).toBeNull();
  });
});

describe("validateProductForm", () => {
  it("devolve o produto limpo quando o formulário é válido", () => {
    const result = validateProductForm({ name: " Calabresa ", description: " Molho ", price: "50", categoryName: " Tradicionais " });
    expect(result).toEqual({ ok: true, value: { name: "Calabresa", description: "Molho", price: 50, categoryName: "Tradicionais" } });
  });

  it("explica o erro quando falta algo", () => {
    const result = validateProductForm({ name: "Calabresa", description: "", price: "50", categoryName: "" });
    expect(result.ok).toBe(false);
  });
});

describe("groupByCategory", () => {
  const product = (id: string, category: string) =>
    ({ id, name: id, description: "", price: 1, active: true, categoryId: category, category: { id: category, name: category, slug: category, sortOrder: 0 } }) as ProductWithCategory;

  it("agrupa mantendo a ordem de aparição", () => {
    const groups = groupByCategory([product("a", "Doces"), product("b", "Bebidas"), product("c", "Doces")]);
    expect(groups.map(([name, items]) => [name, items.map((item) => item.id)])).toEqual([["Doces", ["a", "c"]], ["Bebidas", ["b"]]]);
  });
});
