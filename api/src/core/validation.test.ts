import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ValidationError } from "./errors";
import { parseOrThrow, price, requiredText, slugify } from "./validation";

describe("price", () => {
  const schema = price();

  it("aceita valores entre R$ 0,01 e R$ 9.999,99 com até duas casas", () => {
    for (const value of [0.01, 79.99, 9999.99]) expect(schema.safeParse(value).success).toBe(true);
  });

  it("rejeita zero, negativos, excesso de casas e não-números", () => {
    for (const value of [0, -1, 10000, 1.001, "10", Number.NaN]) expect(schema.safeParse(value).success).toBe(false);
  });
});

describe("requiredText", () => {
  const schema = requiredText(12);

  it("exige conteúdo e devolve o texto sem espaços nas pontas", () => {
    expect(schema.parse("  Calabresa ")).toBe("Calabresa");
    expect(schema.safeParse("   ").success).toBe(false);
    expect(schema.safeParse("a".repeat(13)).success).toBe(false);
    expect(schema.safeParse(42).success).toBe(false);
  });
});

describe("slugify", () => {
  it("remove acentos e símbolos", () => {
    expect(slugify("Pizzas Doces & Especiais")).toBe("pizzas-doces-especiais");
    expect(slugify("Promoções")).toBe("promocoes");
    expect(slugify("!!!")).toBe("");
  });
});

describe("parseOrThrow", () => {
  const schema = z.object({ name: requiredText(10, "Nome inválido.") });

  it("usa a mensagem do campo inválido", () => {
    expect(() => parseOrThrow(schema, { name: "" })).toThrow(new ValidationError("Nome inválido."));
  });

  it("prefere a mensagem única da rota quando informada", () => {
    expect(() => parseOrThrow(schema, { name: "" }, "Pedido inválido.")).toThrow("Pedido inválido.");
  });
});
