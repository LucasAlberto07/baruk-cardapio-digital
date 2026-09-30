import { z } from "zod";
import { parseOrThrow, price, requireNonEmptyRecord, requireRecord, requiredText } from "../../core/validation";

const createExtraSchema = z.object({
  name: requiredText(80),
  price: price(),
});

const updateExtraSchema = z.object({
  name: requiredText(80, "Nome inválido.").optional(),
  price: price("Preço deve ser entre R$ 0,01 e R$ 9.999,99, com até duas casas decimais.").optional(),
});

export type CreateExtraInput = z.infer<typeof createExtraSchema>;
export type UpdateExtraInput = z.infer<typeof updateExtraSchema>;

export function parseCreateExtra(body: unknown): CreateExtraInput {
  return parseOrThrow(createExtraSchema, requireRecord(body), "Informe nome válido e preço entre R$ 0,01 e R$ 9.999,99.");
}

export function parseUpdateExtra(body: unknown): UpdateExtraInput {
  return parseOrThrow(updateExtraSchema, requireNonEmptyRecord(body, "Informe campos para atualizar."));
}
