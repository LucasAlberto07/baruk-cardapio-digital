import { Product, Extra, Category, Promo } from "@baruk/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const adminHeaders = (headers: Record<string, string> = {}) => ({ ...headers, "x-admin-key": sessionStorage.getItem("baruk-admin-key") ?? "" });

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erro na API");
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  admin: {
    login: (key: string) => fetch(`${API_URL}/api/admin/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    }).then((r) => json<void>(r)),
  },
  products: {
    list: () => fetch(`${API_URL}/api/products`, { headers: adminHeaders() }).then((r) => json<(Product & { category: { name: string } })[]>(r)),
    create: (data: { name: string; description: string; price: number; categoryId?: string; categoryName?: string }) =>
      fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
      }).then((r) => json<Product>(r)),
    update: (id: string, data: Partial<Product>) =>
      fetch(`${API_URL}/api/products/${id}`, {
        method: "PUT",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
      }).then((r) => json<Product>(r)),
    remove: (id: string) => fetch(`${API_URL}/api/products/${id}`, { method: "DELETE", headers: adminHeaders() }).then((r) => json<void>(r)),
  },
  extras: {
    list: () => fetch(`${API_URL}/api/extras`).then((r) => json<Extra[]>(r)),
    create: (data: { name: string; price: number }) =>
      fetch(`${API_URL}/api/extras`, {
        method: "POST",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
      }).then((r) => json<Extra>(r)),
    update: (id: string, data: Partial<Extra>) =>
      fetch(`${API_URL}/api/extras/${id}`, {
        method: "PUT",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
      }).then((r) => json<Extra>(r)),
    remove: (id: string) => fetch(`${API_URL}/api/extras/${id}`, { method: "DELETE", headers: adminHeaders() }).then((r) => json<void>(r)),
  },
  categories: {
    list: () => fetch(`${API_URL}/api/categories`, { headers: adminHeaders() }).then((r) => json<(Category & { _count: { products: number } })[]>(r)),
    create: (data: { name: string; sortOrder?: number }) =>
      fetch(`${API_URL}/api/categories`, {
        method: "POST",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
      }).then((r) => json<Category>(r)),
    // O slug não é editável.
    update: (id: string, data: Partial<Pick<Category, "name" | "sortOrder">>) =>
      fetch(`${API_URL}/api/categories/${id}`, {
        method: "PUT",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
      }).then((r) => json<Category>(r)),
    remove: (id: string) => fetch(`${API_URL}/api/categories/${id}`, { method: "DELETE", headers: adminHeaders() }).then((r) => json<void>(r)),
  },
  promos: {
    list: () => fetch(`${API_URL}/api/promos`).then((r) => json<Promo[]>(r)),
    create: (data: Omit<Promo, "id">) =>
      fetch(`${API_URL}/api/promos`, {
        method: "POST",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
      }).then((r) => json<Promo>(r)),
    update: (id: string, data: Partial<Omit<Promo, "id">>) =>
      fetch(`${API_URL}/api/promos/${id}`, {
        method: "PUT",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
      }).then((r) => json<Promo>(r)),
    remove: (id: string) => fetch(`${API_URL}/api/promos/${id}`, { method: "DELETE", headers: adminHeaders() }).then((r) => json<void>(r)),
  },
};
