import { formatBRL } from "@baruk/shared";
import { CartLine, lineTotal } from "../../domain/cart";
import { CloseIcon, EditIcon, MinusIcon, PlusIcon } from "../icons";

type Props = {
  line: CartLine;
  isDrink: boolean;
  onChangeQty: (delta: number) => void;
  onRemove: () => void;
  /** Só pizzas podem ser editadas (reabre o modal de adicionais). */
  onEdit?: () => void;
};

export function CartItem({ line, isDrink, onChangeQty, onRemove, onEdit }: Props) {
  return (
    <li className="cart-item">
      <div className={isDrink ? "thumb pz drink" : "thumb pz"} aria-hidden />

      <div className="cart-item-body">
        <div className="cart-item-title">
          <strong>{line.title}</strong>
          <button className="icon-btn remove" onClick={onRemove} aria-label={`Remover ${line.title}`}><CloseIcon /></button>
        </div>
        {line.details.map((detail) => <p key={detail} className="cart-item-detail">{detail}</p>)}
        {onEdit && (
          <button className="edit-btn" onClick={onEdit}><EditIcon /> Editar</button>
        )}
      </div>

      <div className="cart-item-side">
        <div className="stepper" role="group" aria-label={`Quantidade de ${line.title}`}>
          <button onClick={() => onChangeQty(-1)} aria-label="Diminuir"><MinusIcon /></button>
          <span aria-live="polite">{line.qty}</span>
          <button onClick={() => onChangeQty(1)} aria-label="Aumentar"><PlusIcon /></button>
        </div>
        <strong className="cart-item-price">{formatBRL(lineTotal(line))}</strong>
      </div>
    </li>
  );
}
