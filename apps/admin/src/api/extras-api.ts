import { Extra } from "@baruk/shared";
import { http } from "./http";

export const extrasApi = {
  list: () => http.get<Extra[]>("/api/extras"),
  create: (data: Omit<Extra, "id">) => http.post<Extra>("/api/extras", data),
  update: (id: string, changes: Partial<Omit<Extra, "id">>) => http.put<Extra>(`/api/extras/${id}`, changes),
  remove: (id: string) => http.delete(`/api/extras/${id}`),
};
