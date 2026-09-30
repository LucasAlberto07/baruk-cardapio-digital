import { Category, MenuResponse, Product, Promo, isDrinkCategory, weekdayInSaoPaulo } from "@baruk/shared";

export const PROMO_SECTION_NAME = "Promoções";

export type MenuSection = { category: Category; products: Product[]; isDrinks: boolean };

export type OrganizedMenu = {
  sections: MenuSection[];
  /** Bebidas que podem acompanhar uma pizza. */
  drinks: Product[];
  /** Nomes para a navegação: promoções primeiro, depois cada categoria. */
  navigation: string[];
};

/** Ordena o cardápio para exibição: categorias na ordem cadastrada, bebidas por último. */
export function organizeMenu(menu: MenuResponse): OrganizedMenu {
  const byCategory = (category: Category) => menu.products.filter((product) => product.categoryId === category.id);
  const ordered = [
    ...menu.categories.filter((category) => !isDrinkCategory(category)),
    ...menu.categories.filter(isDrinkCategory),
  ];

  const sections = ordered.map((category) => ({ category, products: byCategory(category), isDrinks: isDrinkCategory(category) }));
  return {
    sections,
    drinks: sections.filter((section) => section.isDrinks).flatMap((section) => section.products),
    navigation: [PROMO_SECTION_NAME, ...ordered.map((category) => category.name)],
  };
}

/** A API só aceita promoções com preço no próprio dia (fuso de São Paulo). */
export function isPromoToday(promo: Promo, now = new Date()): boolean {
  return promo.weekday === weekdayInSaoPaulo(now);
}

export function hasPrice(promo: Promo): promo is Promo & { price: number } {
  return typeof promo.price === "number" && promo.price > 0;
}
