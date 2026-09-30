import { z } from "zod";
import { ValidationError } from "../../core/errors";
import { optionalText, parseOrThrow, price, requireNonEmptyRecord, requireRecord, requiredText } from "../../core/validation";
import { NewPromo } from "./promos.repository";

const WEEKDAY_MESSAGE = "Dia da semana deve ser de 0 (domingo) a 6 (sábado).";

// Todos os campos são opcionais aqui: a criação exige os obrigatórios à parte,
// e a atualização aceita qualquer subconjunto.
const promoFieldsSchema = z.object({
  weekday: z.number({ message: WEEKDAY_MESSAGE }).int(WEEKDAY_MESSAGE).min(0, WEEKDAY_MESSAGE).max(6, WEEKDAY_MESSAGE).optional(),
  label: requiredText(40, "Rótulo inválido.").optional(),
  title: requiredText(100, "Título inválido.").optional(),
  description: requiredText(500, "Descrição inválida.").optional(),
  price: price("Preço deve ser nulo ou entre R$ 0,01 e R$ 9.999,99.").nullable().optional(),
  note: optionalText(200, "Observação inválida.").nullable().optional()
    .transform((note) => (note === undefined ? undefined : note || null)),
});

export type UpdatePromoInput = z.infer<typeof promoFieldsSchema>;
export type CreatePromoInput = NewPromo;

export function parseCreatePromo(body: unknown): CreatePromoInput {
  const { weekday, label, title, description, price = null, note = null } = parseOrThrow(promoFieldsSchema, requireRecord(body));
  if (weekday === undefined || !label || !title || !description) {
    throw new ValidationError("Informe dia da semana, rótulo, título e descrição.");
  }
  return { weekday, label, title, description, price, note };
}

export function parseUpdatePromo(body: unknown): UpdatePromoInput {
  return parseOrThrow(promoFieldsSchema, requireNonEmptyRecord(body, "Informe campos para atualizar."));
}
