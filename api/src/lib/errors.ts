import { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof Error && error.message === "Origem não permitida pelo CORS.") {
    res.status(403).json({ error: "Origem não permitida." });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: "JSON inválido." });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      res.status(404).json({ error: "Registro não encontrado." });
      return;
    }
    if (error.code === "P2002") {
      res.status(409).json({ error: "Já existe um registro com esses dados." });
      return;
    }
    if (error.code === "P2003") {
      res.status(409).json({ error: "A operação conflita com registros relacionados." });
      return;
    }
  }

  console.error("Erro não tratado na API:", error);
  res.status(500).json({ error: "Erro interno do servidor." });
};