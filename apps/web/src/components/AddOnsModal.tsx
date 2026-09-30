import { ReactNode } from "react";
import { Extra, Product, formatBRL } from "@baruk/shared";
import { useCart } from "../context/CartContext";
import { SLICE_OPTIONS } from "../domain/cart-lines";
import { CartLine } from "../domain/cart";
import { usePizzaBuilder } from "../hooks/usePizzaBuilder";

type Props = {
  product: Product;
  extras: Extra[];
  drinks: Product[];
  /** Item do carrinho sendo editado; ausente ao montar uma pizza nova. */
  editing?: CartLine | null;
  onClose: () => void;
};

export function AddOnsModal({ product, extras, drinks, editing = null, onClose }: Props) {
  const { addLine, replaceLine } = useCart();
  const pizza = usePizzaBuilder(product, extras, drinks, editing);

  function confirm() {
    if (editing) replaceLine(editing.key, pizza.toCartLine());
    else addLine(pizza.toCartLine());
    onClose();
  }

  return (
    <div className="overlay overlay-top" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="am-panel">
        <header>
          <div>
            <h2>Adicionais — {product.name}</h2>
            <p className="am-sub">Incremente sua pizza</p>
          </div>
          <button className="close-btn" style={{ position: "static" }} onClick={onClose} aria-label="Fechar">×</button>
        </header>

        <div className="am-scroll">
          <GroupHeader title="Quantas fatias?" hint={`(${pizza.slice})`} />
          {SLICE_OPTIONS.map((slice) => (
            <ChoiceRow key={slice} type="radio" name="fatia" checked={pizza.slice === slice} onChange={() => pizza.setSlice(slice)}>
              <strong>{slice}</strong>
            </ChoiceRow>
          ))}

          <GroupHeader title="Adicionais" hint="Incremente sua pizza" />
          {extras.map((extra) => (
            <ChoiceRow key={extra.id} type="checkbox" checked={pizza.isExtraSelected(extra.id)} onChange={() => pizza.toggleExtra(extra.id)}>
              <strong>{extra.name}</strong><span>+{formatBRL(extra.price)}</span>
            </ChoiceRow>
          ))}

          <div className="am-group-head"><span>Refrigerante</span><span className="req">*Obrigatório</span></div>
          <ChoiceRow type="radio" name="drink" checked={pizza.drinkId === null} onChange={() => pizza.setDrinkId(null)}>
            <strong>Não precisa</strong>
          </ChoiceRow>
          {drinks.map((drink) => (
            <ChoiceRow key={drink.id} type="radio" name="drink" checked={pizza.drinkId === drink.id} onChange={() => pizza.setDrinkId(drink.id)}>
              <strong>{drink.name}</strong><span>+{formatBRL(drink.price)}</span>
            </ChoiceRow>
          ))}
        </div>

        <div className="am-bar">
          <div className="am-qty">
            <button onClick={pizza.decreaseQty}>−</button>
            <span>{pizza.qty}</span>
            <button onClick={pizza.increaseQty}>+</button>
          </div>
          <button className="am-add" onClick={confirm}>
            <span className="l1">{editing ? "Salvar alterações" : "Adicionar ao pedido"}</span>
            <span className="l2">Valor: {formatBRL(pizza.totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function GroupHeader({ title, hint }: { title: string; hint: string }) {
  return <div className="am-group-head"><span>{title}</span><span className="hint">{hint}</span></div>;
}

type ChoiceRowProps = {
  type: "radio" | "checkbox";
  name?: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
};

function ChoiceRow({ type, name, checked, onChange, children }: ChoiceRowProps) {
  return (
    <label className="am-row">
      <input type={type} name={name} checked={checked} onChange={onChange} />
      <div className="info">{children}</div>
    </label>
  );
}
