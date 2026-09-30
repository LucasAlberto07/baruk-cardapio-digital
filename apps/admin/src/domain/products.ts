import { isValidPrice, toCents } from "@baruk/shared";
import type { NewProduct, ProductWithCategory } from "../api/products-api";

/** Valores digitados no formulário (tudo texto, como vem dos inputs). */
export type ProductForm = { name: string; description: string; price: string; categoryName: string };

export const EMPTY_PRODUCT_FORM: ProductForm = { name: "", description: "", price: "", categoryName: "" };

export const PRICE_RULE_MESSAGE = "O preço deve ficar entre R$ 0,01 e R$ 9.999,99, com até duas casas decimais.";

/** Converte o texto do input em preço válido, ou null. Mesma regra que a API aplica. */
export function parsePriceInput(text: string): number | null {
  const value = Number(text);
  if (text.trim() === "" || !isValidPrice(value)) return null;
  return toCents(value) / 100;
}

export function formatPriceInput(price: number): string {
  return price.toFixed(2);
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateProductForm(form: ProductForm): ValidationResult<NewProduct> {
  const price = parsePriceInput(form.price);
  if (!form.name.trim() || !form.categoryName.trim() || price === null) {
    return { ok: false, error: "Informe nome, categoria e preço entre R$ 0,01 e R$ 9.999,99." };
  }
  return {
    ok: true,
    value: { name: form.name.trim(), description: form.description.trim(), price, categoryName: form.categoryName.trim() },
  };
}

/** Agrupa os produtos pelo nome da categoria, na ordem em que as categorias aparecem. */
export function groupByCategory(products: ProductWithCategory[]): [string, ProductWithCategory[]][] {
  const groups = new Map<string, ProductWithCategory[]>();
  for (const product of products) {
    const group = groups.get(product.category.name) ?? [];
    group.push(product);
    groups.set(product.category.name, group);
  }
  return [...groups.entries()];
}
