import { MenuResponse } from "@baruk/shared";
import { http } from "./http";

export function fetchMenu(): Promise<MenuResponse> {
  return http.get("/api/menu");
}
