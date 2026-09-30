import { Category, Product } from "@baruk/shared";
import { http } from "./http";

export type ProductWithCategory = Product & { category: Category };
export type NewProduct = { name: string; description: string; price: number; categoryId?: string; categoryName?: string };
export type ProductChanges = Partial<Pick<Product, "name" | "description" | "price" | "active">>;

export const productsApi = {
  list: () => http.get<ProductWithCategory[]>("/api/products"),
  create: (data: NewProduct) => http.post<Product>("/api/products", data),
  update: (id: string, changes: ProductChanges) => http.put<Product>(`/api/products/${id}`, changes),
  remove: (id: string) => http.delete(`/api/products/${id}`),
};
