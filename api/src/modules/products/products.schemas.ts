import { z } from "zod";
import { entityId, optionalText, parseOrThrow, price, requireNonEmptyRecord, requireRecord, requiredText } from "../../core/validation";

const PRICE_MESSAGE = "Preço deve ser entre R$ 0,01 e R$ 9.999,99, com até duas casas decimais.";

// A categoria pode vir por id (existente) ou por nome (criada se não existir);
// um valor inválido em um dos campos é ignorado se o outro for válido.
const createProductSchema = z.object({
  name: requiredText(100),
  description: optionalText(500).optional(),
  price: price(),
  categoryId: entityId.optional().catch(undefined),
  categoryName: requiredText(80).optional().catch(undefined),
}).transform(({ categoryId, categoryName, ...product }, ctx) => {
  const category: CategoryReference | null = categoryId !== undefined ? { id: categoryId }
    : categoryName !== undefined ? { name: categoryName }
    : null;
  if (!category) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe a categoria." });
    return z.NEVER;
  }
  return { ...product, category };
});

export type CategoryReference = { id: string } | { name: string };

const updateProductSchema = z.object({
  name: requiredText(100, "Nome inválido.").optional(),
  description: optionalText(500, "Descrição inválida.").optional(),
  price: price(PRICE_MESSAGE).optional(),
  active: z.boolean({ message: "Estado ativo inválido." }).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export function parseCreateProduct(body: unknown): CreateProductInput {
  return parseOrThrow(
    createProductSchema,
    requireRecord(body),
    "Informe nome, descrição válida, preço entre R$ 0,01 e R$ 9.999,99 e categoria.",
  );
}

export function parseUpdateProduct(body: unknown): UpdateProductInput {
  return parseOrThrow(updateProductSchema, requireNonEmptyRecord(body, "Informe ao menos um campo para atualizar."));
}
