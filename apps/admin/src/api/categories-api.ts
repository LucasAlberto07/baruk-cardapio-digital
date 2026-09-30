import { Category } from "@baruk/shared";
import { http } from "./http";

export type CategoryWithCount = Category & { _count: { products: number } };
/** O slug não é editável. */
export type CategoryChanges = Partial<Pick<Category, "name" | "sortOrder">>;

export const categoriesApi = {
  list: () => http.get<CategoryWithCount[]>("/api/categories"),
  create: (data: { name: string; sortOrder?: number }) => http.post<Category>("/api/categories", data),
  update: (id: string, changes: CategoryChanges) => http.put<Category>(`/api/categories/${id}`, changes),
  remove: (id: string) => http.delete(`/api/categories/${id}`),
};
