import { createHttpClient } from "@baruk/shared";
import { env } from "../config/env";

export const http = createHttpClient({ baseUrl: env.apiUrl });
