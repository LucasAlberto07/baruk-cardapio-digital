import { timingSafeEqual } from "node:crypto";
import { RequestHandler } from "express";
import { ServiceUnavailableError, UnauthorizedError } from "../core/errors";

export type AdminAuth = {
  /** Middleware que exige o header `x-admin-key`. */
  requireAdmin: RequestHandler;
  /** POST /api/admin/session: confere a chave digitada no painel. */
  verifySession: RequestHandler;
};

function keysMatch(candidate: unknown, adminKey: string): boolean {
  if (typeof candidate !== "string") return false;
  const candidateBuffer = Buffer.from(candidate);
  const adminKeyBuffer = Buffer.from(adminKey);
  return candidateBuffer.length === adminKeyBuffer.length && timingSafeEqual(candidateBuffer, adminKeyBuffer);
}

/** `adminKey` nulo significa painel desativado: as rotas administrativas respondem 503. */
export function createAdminAuth(adminKey: string | null): AdminAuth {
  return {
    requireAdmin: (req, _res, next) => {
      if (!adminKey) return next(new ServiceUnavailableError("Operação administrativa indisponível."));
      if (!keysMatch(req.header("x-admin-key"), adminKey)) return next(new UnauthorizedError("Autenticação administrativa necessária."));
      next();
    },
    verifySession: (req, res, next) => {
      if (!adminKey) return next(new ServiceUnavailableError("Painel indisponível: configure ADMIN_API_KEY no servidor."));
      if (!keysMatch(req.body?.key, adminKey)) return next(new UnauthorizedError("Chave administrativa inválida."));
      res.status(204).end();
    },
  };
}
