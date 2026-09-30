import { Prisma } from "@prisma/client";
import { AppError, ConflictError, NotFoundError } from "../../core/errors";

/** Traduz os erros conhecidos do Prisma para erros de domínio; devolve null para os demais. */
export function mapPrismaError(error: unknown): AppError | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;

  switch (error.code) {
    case "P2025":
      return new NotFoundError("Registro não encontrado.");
    case "P2002":
      return new ConflictError("Já existe um registro com esses dados.");
    case "P2003":
      return new ConflictError("A operação conflita com registros relacionados.");
    default:
      return null;
  }
}
