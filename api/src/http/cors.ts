import cors from "cors";
import { ForbiddenError } from "../core/errors";

/** Libera apenas as origens configuradas; requisições sem Origin (curl, health checks) passam. */
export function createCors(allowedOrigins: string[]) {
  return cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new ForbiddenError("Origem não permitida."));
    },
  });
}
