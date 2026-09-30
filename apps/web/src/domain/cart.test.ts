import { describe, expect, it } from "vitest";
import { Extra, Product, Promo } from "@baruk/shared";
import { cartReducer, cartTotals, CartLine, MAX_QTY_PER_LINE, toOrderItems } from "./cart";
import { drinkLine, pizzaLine, promoLine } from "./cart-lines";

const product = (id: string, name: string, price: number): Product => ({ id, name, price, description: "", categoryId: "c", active: true });
const costela = product("costela", "Costela", 79.99);
const sprite = product("sprite", "Sprite 2L", 14);
const alho: Extra = { id: "alho", name: "Alho", price: 6 };
const bacon: Extra = { id: "bacon", name: "Bacon", price: 6 };
const combo: Promo & { price: number } = { id: "p1", weekday: 2, label: "Terça", title: "Combo", description: "", price: 89.9 };

describe("pizzaLine", () => {
  it("soma adicionais e bebida em centavos e monta o rótulo", () => {
    const line = pizzaLine({ product: costela, slice: "8 fatias", extras: [bacon, alho], drink: sprite, qty: 2 });
    expect(line.unitPrice).toBe(105.99);
    expect(line.label).toBe("Pizza Costela (8 fatias) + Alho, Bacon + Sprite 2L");
    expect(line.item).toEqual({ kind: "product", productId: "costela", extraIds: ["bacon", "alho"], drinkProductId: "sprite", slice: "8 fatias" });
  });

  it("gera a mesma chave para a mesma montagem, independente da ordem dos adicionais", () => {
    const a = pizzaLine({ product: costela, slice: "8 fatias", extras: [alho, bacon], drink: null, qty: 1 });
    const b = pizzaLine({ product: costela, slice: "8 fatias", extras: [bacon, alho], drink: null, qty: 1 });
    expect(a.key).toBe(b.key);
  });
});

describe("cartReducer", () => {
  it("soma a quantidade ao adicionar uma linha igual", () => {
    let lines: CartLine[] = [];
    lines = cartReducer(lines, { type: "add", line: drinkLine(sprite) });
    lines = cartReducer(lines, { type: "add", line: drinkLine(sprite) });
    expect(lines).toHaveLength(1);
    expect(lines[0].qty).toBe(2);
  });

  it("remove a linha quando a quantidade chega a zero", () => {
    const lines = cartReducer([drinkLine(sprite)], { type: "changeQty", key: "bebida:sprite", delta: -1 });
    expect(lines).toEqual([]);
  });

  it("não passa do limite de quantidade aceito pela API", () => {
    const lines = cartReducer([drinkLine(sprite)], { type: "changeQty", key: "bebida:sprite", delta: 100 });
    expect(lines[0].qty).toBe(MAX_QTY_PER_LINE);
  });
});

describe("cartTotals / toOrderItems", () => {
  const lines = [
    { ...pizzaLine({ product: costela, slice: "12 fatias", extras: [alho], drink: null, qty: 3 }) },
    promoLine(combo),
  ];

  it("totaliza em centavos", () => {
    expect(cartTotals(lines)).toEqual({ totalItems: 4, totalPrice: 347.87 });
  });

  it("envia só ids e quantidades para a API", () => {
    expect(toOrderItems(lines)).toEqual([
      { productId: "costela", qty: 3, extraIds: ["alho"], drinkProductId: null, slice: "12 fatias" },
      { promoId: "p1", qty: 1 },
    ]);
  });
});
