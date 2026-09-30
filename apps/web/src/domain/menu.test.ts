import { describe, expect, it } from "vitest";
import { MenuResponse } from "@baruk/shared";
import { hasPrice, isPromoToday, organizeMenu } from "./menu";

const menu: MenuResponse = {
  categories: [
    { id: "b", name: "Bebidas", slug: "bebidas", sortOrder: 1 },
    { id: "t", name: "Tradicionais", slug: "tradicionais", sortOrder: 2 },
  ],
  products: [
    { id: "sprite", name: "Sprite", description: "", price: 14, active: true, categoryId: "b" },
    { id: "calabresa", name: "Calabresa", description: "", price: 50, active: true, categoryId: "t" },
  ],
  extras: [],
  promos: [],
};

describe("organizeMenu", () => {
  it("coloca as bebidas por último e separa a lista de bebidas", () => {
    const organized = organizeMenu(menu);
    expect(organized.sections.map((section) => section.category.name)).toEqual(["Tradicionais", "Bebidas"]);
    expect(organized.sections[1].isDrinks).toBe(true);
    expect(organized.drinks.map((drink) => drink.id)).toEqual(["sprite"]);
    expect(organized.navigation).toEqual(["Promoções", "Tradicionais", "Bebidas"]);
  });
});

describe("promoções", () => {
  const promo = { id: "p", weekday: 2, label: "Terça", title: "Combo", description: "", price: 60 };

  it("reconhece a promoção do dia no fuso de São Paulo", () => {
    expect(isPromoToday(promo, new Date("2026-09-29T15:00:00Z"))).toBe(true);
    // Quarta 02h UTC ainda é terça em São Paulo.
    expect(isPromoToday(promo, new Date("2026-09-30T02:00:00Z"))).toBe(true);
    expect(isPromoToday(promo, new Date("2026-09-30T15:00:00Z"))).toBe(false);
  });

  it("só considera com preço quando o valor é positivo", () => {
    expect(hasPrice(promo)).toBe(true);
    expect(hasPrice({ ...promo, price: null })).toBe(false);
  });
});
