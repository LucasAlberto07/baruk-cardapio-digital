export const MIN_PRICE = 0.01;
export const MAX_PRICE = 9999.99;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validText(value: unknown, maxLength: number, allowEmpty = false): value is string {
  return typeof value === "string" && (allowEmpty || value.trim().length > 0) && value.length <= maxLength;
}

export function validPrice(value: unknown, allowZero = false): value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value > MAX_PRICE) return false;
  if (allowZero && value === 0) return true;
  return value >= MIN_PRICE && Math.abs(Math.round(value * 100) - value * 100) < 1e-8;
}