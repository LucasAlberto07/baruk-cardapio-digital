import { formatBRL } from "@baruk/shared";
import { useCart } from "../context/CartContext";

/** Barra fixa com o resumo do carrinho; some quando o carrinho está vazio. */
export function CartBar({ onOpen }: { onOpen: () => void }) {
  const { totalItems, totalPrice } = useCart();
  if (totalItems === 0) return null;

  return (
    <div className="bar">
      <button onClick={onOpen}>
        <span>{totalItems} {totalItems === 1 ? "item" : "itens"}</span>
        <span>Ver pedido · {formatBRL(totalPrice)}</span>
      </button>
    </div>
  );
}
