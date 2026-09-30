import { PrismaClient } from "@prisma/client";

// Uma única instância do client em toda a aplicação — evita esgotar
// conexões com o banco quando o servidor recarrega em desenvolvimento.
export const prisma = new PrismaClient();
