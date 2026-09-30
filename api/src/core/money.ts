/** Qualquer valor monetário vindo do banco (Decimal do Prisma, string ou number). */
type DecimalLike = { toString(): string };

export function decimalToNumber(value: DecimalLike): number {
  return Number(value.toString());
}

export function nullableDecimalToNumber(value: DecimalLike | null): number | null {
  return value === null ? null : decimalToNumber(value);
}
