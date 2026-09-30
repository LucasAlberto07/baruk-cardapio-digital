import { ErrorRequestHandler } from "express";
import { AppError } from "../core/errors";
import { mapPrismaError } from "../infra/prisma/prisma-errors";

function isMalformedJson(error: unknown): boolean {
  return error instanceof SyntaxError && "body" in error;
}

/** Único ponto que converte erros em respostas HTTP. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const appError = error instanceof AppError ? error : mapPrismaError(error);
  if (appError) {
    res.status(appError.statusCode).json({ error: appError.message });
    return;
  }

  if (isMalformedJson(error)) {
    res.status(400).json({ error: "JSON inválido." });
    return;
  }

  console.error("Erro não tratado na API:", error);
  res.status(500).json({ error: "Erro interno do servidor." });
};
