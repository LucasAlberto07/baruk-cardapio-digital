/**
 * Categoria cujos produtos são bebidas: podem acompanhar uma pizza e não
 * aceitam adicionais. O slug é imutável na API, então esta regra não quebra
 * se o lojista renomear a categoria.
 */
export const DRINKS_CATEGORY_SLUG = "bebidas";

export function isDrinkCategory(category: { slug: string } | null | undefined): boolean {
  return category?.slug === DRINKS_CATEGORY_SLUG;
}

export const STORE_TIME_ZONE = "America/Sao_Paulo";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: STORE_TIME_ZONE, weekday: "short" });

/** Dia da semana (0 = domingo ... 6 = sábado) no fuso da pizzaria, não do servidor/navegador. */
export function weekdayInSaoPaulo(date: Date = new Date()): number {
  return WEEKDAYS.indexOf(weekdayFormatter.format(date));
}
