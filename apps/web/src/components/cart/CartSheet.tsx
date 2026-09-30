import { useEffect, useState } from "react";
import { Product, Promo, formatBRL } from "@baruk/shared";
import { useCart } from "../../context/CartContext";
import { CartLine } from "../../domain/cart";
import { BackIcon, CartIcon, CheckCircleIcon, UndoIcon } from "../icons";
import { CartItem } from "./CartItem";
import { CheckoutForm } from "./CheckoutForm";
import { DrinkUpsell } from "./DrinkUpsell";

type Step = "cart" | "checkout";

type Props = {
  appliedPromo: Promo | null;
  drinks: Product[];
  onEditLine: (line: CartLine) => void;
  onClose: () => void;
};

/** Tela do pedido em duas etapas: revisar os itens e, depois, informar a entrega. */
export function CartSheet({ appliedPromo, drinks, onEditLine, onClose }: Props) {
  const { lines, totalItems } = useCart();
  const [step, setStep] = useState<Step>("cart");

  // Carrinho esvaziado na etapa de entrega: volta para a lista.
  useEffect(() => {
    if (lines.length === 0) setStep("cart");
  }, [lines.length]);

  const goBack = step === "checkout" ? () => setStep("cart") : onClose;

  return (
    <div className="overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="cart-sheet" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <header className="cart-header">
          <button className="icon-btn" onClick={goBack} aria-label={step === "checkout" ? "Voltar ao pedido" : "Fechar pedido"}>
            <BackIcon />
          </button>
          <h2 id="cart-title">{step === "cart" ? "Meu pedido" : "Finalizar pedido"}</h2>
          <span className="cart-count" aria-label={`${totalItems} itens no pedido`}>
            <CartIcon />
            {totalItems > 0 && <span className="cart-count-badge">{totalItems}</span>}
          </span>
        </header>

        <div className="cart-body">
          {appliedPromo && (
            <div className="applied">Promoção aplicada: {appliedPromo.label} — {appliedPromo.title}</div>
          )}
          {step === "cart"
            ? <CartStep drinks={drinks} onEditLine={onEditLine} onContinueShopping={onClose} onFinish={() => setStep("checkout")} />
            : <CheckoutStep appliedPromo={appliedPromo} onSent={onClose} />}
        </div>
      </div>
    </div>
  );
}

type CartStepProps = {
  drinks: Product[];
  onEditLine: (line: CartLine) => void;
  onContinueShopping: () => void;
  onFinish: () => void;
};

function CartStep({ drinks, onEditLine, onContinueShopping, onFinish }: CartStepProps) {
  const { lines, totalPrice, changeQty, removeLine } = useCart();
  const drinkIds = new Set(drinks.map((drink) => drink.id));
  const isDrink = (line: CartLine) => line.item.kind === "product" && drinkIds.has(line.item.productId);
  const isPizza = (line: CartLine) => line.item.kind === "product" && !isDrink(line);

  if (lines.length === 0) {
    return (
      <div className="cart-empty">
        <p>Seu pedido está vazio.</p>
        <button className="secondary-btn" onClick={onContinueShopping}><UndoIcon /> Ver o cardápio</button>
      </div>
    );
  }

  return (
    <>
      <ul className="cart-items">
        {lines.map((line) => (
          <CartItem
            key={line.key}
            line={line}
            isDrink={isDrink(line)}
            onChangeQty={(delta) => changeQty(line.key, delta)}
            onRemove={() => removeLine(line.key)}
            onEdit={isPizza(line) ? () => onEditLine(line) : undefined}
          />
        ))}
      </ul>

      <DrinkUpsell drinks={drinks} />

      <button className="secondary-btn" onClick={onContinueShopping}><UndoIcon /> Continuar comprando</button>

      <div className="cart-summary">
        <div className="cart-summary-row"><span>Itens</span><span>{formatBRL(totalPrice)}</span></div>
        <div className="cart-summary-total">Valor total do pedido: <strong>{formatBRL(totalPrice)}</strong></div>
      </div>

      <button className="finish-btn" onClick={onFinish}><CheckCircleIcon /> Finalizar pedido</button>
    </>
  );
}

function CheckoutStep({ appliedPromo, onSent }: { appliedPromo: Promo | null; onSent: () => void }) {
  const { totalItems, totalPrice } = useCart();

  return (
    <>
      <div className="checkout-summary">
        <span>{totalItems} {totalItems === 1 ? "item" : "itens"}</span>
        <strong>{formatBRL(totalPrice)}</strong>
      </div>
      <CheckoutForm appliedPromo={appliedPromo} onSent={onSent} />
    </>
  );
}
