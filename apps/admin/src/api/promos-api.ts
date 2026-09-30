import { Promo } from "@baruk/shared";
import { http } from "./http";

export const promosApi = {
  list: () => http.get<Promo[]>("/api/promos"),
  create: (data: Omit<Promo, "id">) => http.post<Promo>("/api/promos", data),
  update: (id: string, changes: Partial<Omit<Promo, "id">>) => http.put<Promo>(`/api/promos/${id}`, changes),
  remove: (id: string) => http.delete(`/api/promos/${id}`),
};
