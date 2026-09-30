import { http } from "./http";

/** Confere a chave no servidor; lança ApiError se for inválida. */
export function verifyAdminKey(key: string): Promise<void> {
  return http.post("/api/admin/session", { key });
}
