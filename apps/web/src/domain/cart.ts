import { OrderPayload, SliceOption, toCents } from "@baruk/shared";

export const MAX_QTY_PER_LINE = 30;

/** O que a linha representa para a API: um produto (com opções) ou uma promoção do dia. */
export type CartItemRef =
  | { kind: "product"; productId: string; extraIds: string[]; drinkProductId: string | null; slice: SliceOption | null }
  | { kind: "promo"; promoId: string };

export type CartLine = {
  /** Identifica linhas iguais: adicionar de novo soma a quantidade. */
  key: string;
  label: string;
  unitPrice: number;
  qty: number;
  item: CartItemRef;
};

export type CartAction =
  | { type: "add"; line: CartLine }
  | { type: "changeQty"; key: string; delta: number }
  | { type: "clear" };

const clampQty = (qty: number) => Math.min(qty, MAX_QTY_PER_LINE);

export function cartReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case "add": {
      const existing = lines.find((line) => line.key === action.line.key);
      if (!existing) return [...lines, { ...action.line, qty: clampQty(action.line.qty) }];
      return lines.map((line) => (line === existing ? { ...line, qty: clampQty(line.qty + action.line.qty) } : line));
    }
    case "changeQty":
      return lines
        .map((line) => (line.key === action.key ? { ...line, qty: clampQty(line.qty + action.delta) } : line))
        .filter((line) => line.qty > 0);
    case "clear":
      return [];
  }
}

export function lineTotal(line: CartLine): number {
  return (toCents(line.unitPrice) * line.qty) / 100;
}

export function cartTotals(lines: CartLine[]) {
  return {
    totalItems: lines.reduce((sum, line) => sum + line.qty, 0),
    totalPrice: lines.reduce((sum, line) => sum + toCents(line.unitPrice) * line.qty, 0) / 100,
  };
}

/** Converte o carrinho no payload da API: só ids e quantidades, nunca preços. */
export function toOrderItems(lines: CartLine[]): OrderPayload["items"] {
  return lines.map(({ item, qty }) => {
    if (item.kind === "promo") return { promoId: item.promoId, qty };
    return {
      productId: item.productId,
      qty,
      extraIds: item.extraIds,
      drinkProductId: item.drinkProductId,
      ...(item.slice ? { slice: item.slice } : {}),
    };
  });
}
