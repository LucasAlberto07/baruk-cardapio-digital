import { z } from "zod";
import { parseOrThrow, requireNonEmptyRecord, requireRecord, requiredText } from "../../core/validation";
import { ValidationError } from "../../core/errors";

const sortOrder = (message?: string) => z.number({ message }).int(message).min(0, message).max(9999, message);

const createCategorySchema = z.object({
  name: requiredText(80),
  sortOrder: sortOrder().optional(),
});

const updateCategorySchema = z.object({
  name: requiredText(80, "Nome inválido.").optional(),
  sortOrder: sortOrder("Ordem deve ser um inteiro entre 0 e 9999.").optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export function parseCreateCategory(body: unknown): CreateCategoryInput {
  return parseOrThrow(createCategorySchema, requireRecord(body), "Informe nome válido e ordem entre 0 e 9999.");
}

export function parseUpdateCategory(body: unknown): UpdateCategoryInput {
  const record = requireNonEmptyRecord(body, "Informe campos para atualizar.");
  // O slug não é editável: regras como a de bebidas dependem dele.
  if ("slug" in record) throw new ValidationError("O identificador (slug) da categoria não pode ser alterado.");
  return parseOrThrow(updateCategorySchema, record);
}
