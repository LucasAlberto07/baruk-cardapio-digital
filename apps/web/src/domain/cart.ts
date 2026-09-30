import { OrderPayload, SliceOption, toCents } from "@baruk/shared";

export const MAX_QTY_PER_LINE = 30;

/** O que a linha representa para a API: um produto (com opções) ou uma promoção do dia. */
export type CartItemRef =
  | { kind: "product"; productId: string; extraIds: string[]; drinkProductId: string | null; slice: SliceOption | null }
  | { kind: "promo"; promoId: string };

export type CartLine = {
  /** Identifica linhas iguais: adicionar de novo soma a quantidade. */
  key: string;
  /** Texto completo numa linha só (mensagem do WhatsApp). */
  label: string;
  /** Nome exibido no carrinho, ex.: "Pizza Calabresa". */
  title: string;
  /** Escolhas exibidas abaixo do nome, ex.: ["8 fatias", "Adicionais: Alho"]. */
  details: string[];
  unitPrice: number;
  qty: number;
  item: CartItemRef;
};

export type CartAction =
  | { type: "add"; line: CartLine }
  | { type: "changeQty"; key: string; delta: number }
  | { type: "remove"; key: string }
  /** Editar: troca a linha antiga pela nova (que se junta a uma igual, se houver). */
  | { type: "replace"; key: string; line: CartLine }
  | { type: "clear" };

const clampQty = (qty: number) => Math.min(qty, MAX_QTY_PER_LINE);

function addLine(lines: CartLine[], newLine: CartLine): CartLine[] {
  const existing = lines.find((line) => line.key === newLine.key);
  if (!existing) return [...lines, { ...newLine, qty: clampQty(newLine.qty) }];
  return lines.map((line) => (line === existing ? { ...line, qty: clampQty(line.qty + newLine.qty) } : line));
}

export function cartReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case "add":
      return addLine(lines, action.line);
    case "remove":
      return lines.filter((line) => line.key !== action.key);
    case "replace": {
      const position = lines.findIndex((line) => line.key === action.key);
      const others = lines.filter((line) => line.key !== action.key);
      if (others.some((line) => line.key === action.line.key)) return addLine(others, action.line);
      // Mantém a linha editada na mesma posição do carrinho.
      const updated = [...others];
      updated.splice(position === -1 ? others.length : position, 0, { ...action.line, qty: clampQty(action.line.qty) });
      return updated;
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
