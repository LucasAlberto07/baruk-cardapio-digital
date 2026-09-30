import { createHttpClient } from "@baruk/shared";
import { env } from "../config/env";
import { adminSession } from "../auth/admin-session";

/** Toda requisição do painel leva a chave da sessão atual. */
export const http = createHttpClient({
  baseUrl: env.apiUrl,
  headers: () => ({ "x-admin-key": adminSession.getKey() ?? "" }),
});
