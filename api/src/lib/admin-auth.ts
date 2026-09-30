import { timingSafeEqual } from "node:crypto";
import { NextFunction, Request, Response } from "express";

function isValidAdminKey(candidate: unknown): candidate is string {
  const configuredKey = process.env.ADMIN_API_KEY;
  if (!configuredKey || configuredKey.length < 32 || typeof candidate !== "string") return false;

  const candidateBuffer = Buffer.from(candidate);
  const configuredBuffer = Buffer.from(configuredKey);
  return candidateBuffer.length === configuredBuffer.length && timingSafeEqual(candidateBuffer, configuredBuffer);
}

export function verifyAdminSession(req: Request, res: Response) {
  if (!process.env.ADMIN_API_KEY || process.env.ADMIN_API_KEY.length < 32) {
    return res.status(503).json({ error: "Painel indisponível: configure ADMIN_API_KEY no servidor." });
  }
  if (!isValidAdminKey(req.body?.key)) {
    return res.status(401).json({ error: "Chave administrativa inválida." });
  }
  return res.status(204).end();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!process.env.ADMIN_API_KEY || process.env.ADMIN_API_KEY.length < 32) {
    return res.status(503).json({ error: "Operação administrativa indisponível." });
  }
  if (!isValidAdminKey(req.header("x-admin-key"))) {
    return res.status(401).json({ error: "Autenticação administrativa necessária." });
  }
  next();
}