import { RequestHandler } from "express";

/**
 * Os dados da API mudam a qualquer momento (preços, pedidos novos): o navegador
 * nunca deve reaproveitar uma resposta antiga.
 */
export const noStore: RequestHandler = (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
};
