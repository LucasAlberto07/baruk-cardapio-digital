import { z } from "zod";
import { ValidationError } from "./errors";

export const MIN_PRICE = 0.01;
export const MAX_PRICE = 9999.99;

const hasContent = (value: string) => value.trim().length > 0;
const hasAtMostTwoDecimals = (value: number) => Math.abs(Math.round(value * 100) - value * 100) < 1e-8;

/** Texto obrigatório (não pode ser só espaços), devolvido sem espaços nas pontas. */
export const requiredText = (maxLength: number, message?: string) =>
  z.string({ message }).max(maxLength, message).refine(hasContent, message).transform((value) => value.trim());

/** Texto que pode ser vazio, devolvido sem espaços nas pontas. */
export const optionalText = (maxLength: number, message?: string) =>
  z.string({ message }).max(maxLength, message).transform((value) => value.trim());

/** Identificador enviado pelo cliente (id de produto, adicional, promoção...). */
export const entityId = z.string().max(100).refine(hasContent);

/** Preço em reais entre R$ 0,01 e R$ 9.999,99, com no máximo duas casas decimais. */
export const price = (message?: string) =>
  z.number({ message }).finite(message).min(MIN_PRICE, message).max(MAX_PRICE, message).refine(hasAtMostTwoDecimals, message);

export function slugify(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Valida `value` com o schema. Em caso de erro lança ValidationError com
 * `fallbackMessage` (quando a rota tem uma mensagem única) ou com a mensagem
 * do primeiro campo inválido.
 */
export function parseOrThrow<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, value: unknown, fallbackMessage?: string): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw new ValidationError(fallbackMessage ?? result.error.issues[0]?.message ?? "Dados inválidos.");
}

/** Exige um objeto JSON no corpo da requisição. */
export function requireRecord(body: unknown, message = "Corpo da requisição inválido."): Record<string, unknown> {
  if (!isRecord(body)) throw new ValidationError(message);
  return body;
}

/** Exige um objeto JSON com ao menos um campo (rotas de atualização parcial). */
export function requireNonEmptyRecord(body: unknown, message: string): Record<string, unknown> {
  if (!isRecord(body) || Object.keys(body).length === 0) throw new ValidationError(message);
  return body;
}
