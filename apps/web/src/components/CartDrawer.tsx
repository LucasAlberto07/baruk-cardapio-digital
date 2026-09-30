import { FormEvent, useState } from "react";
import { Promo, formatBRL } from "@baruk/shared";
import { useCart } from "../context/CartContext";
import { useCheckout } from "../hooks/useCheckout";
import { Customer } from "../domain/whatsapp";

type Props = { onClose: () => void; appliedPromo: Promo | null };

export function CartDrawer({ onClose, appliedPromo }: Props) {
  const { lines, totalPrice } = useCart();

  return (
    <div className="overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="drawer">
        <button className="close-btn" onClick={onClose} aria-label="Fechar">×</button>
        <h2>Seu pedido</h2>

        {appliedPromo && (
          <div className="applied">Promoção aplicada: {appliedPromo.label} — {appliedPromo.title}</div>
        )}

        {lines.length === 0 ? (
          <p className="empty">Seu pedido está vazio.</p>
        ) : (
          <>
            <CartLines />
            <div className="total"><span>Total</span><span>{formatBRL(totalPrice)}</span></div>
            <CheckoutForm appliedPromo={appliedPromo} onSent={onClose} />
          </>
        )}
      </div>
    </div>
  );
}

function CartLines() {
  const { lines, changeQty } = useCart();

  return (
    <>
      {lines.map((line) => (
        <div className="line" key={line.key}>
          <span>{line.label}</span>
          <div className="qty">
            <button onClick={() => changeQty(line.key, -1)} aria-label={`Remover um ${line.label}`}>−</button>
            <span>{line.qty}</span>
            <button onClick={() => changeQty(line.key, 1)} aria-label={`Adicionar um ${line.label}`}>+</button>
          </div>
        </div>
      ))}
    </>
  );
}

function CheckoutForm({ appliedPromo, onSent }: { appliedPromo: Promo | null; onSent: () => void }) {
  const [customer, setCustomer] = useState<Customer>({ name: "", phone: "", address: "", notes: "" });
  const { sendOrder, sending, error } = useCheckout(appliedPromo, onSent);
  const update = (field: keyof Customer) => (value: string) => setCustomer((current) => ({ ...current, [field]: value }));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void sendOrder(customer);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="customer-name">Seu nome</label>
        <input id="customer-name" value={customer.name} onChange={(event) => update("name")(event.target.value)} autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="customer-phone">WhatsApp (para acompanhar o pedido)</label>
        <input id="customer-phone" type="tel" inputMode="tel" placeholder="(11) 91234-5678" value={customer.phone} onChange={(event) => update("phone")(event.target.value)} autoComplete="tel-national" />
      </div>
      <div className="field">
        <label htmlFor="customer-address">Endereço de entrega</label>
        <textarea id="customer-address" rows={2} value={customer.address} onChange={(event) => update("address")(event.target.value)} autoComplete="street-address" />
      </div>
      <div className="field">
        <label htmlFor="customer-notes">Observações (opcional)</label>
        <input id="customer-notes" value={customer.notes} onChange={(event) => update("notes")(event.target.value)} />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="send-btn" type="submit" disabled={sending}>
        {sending ? "Enviando…" : "Enviar pedido no WhatsApp"}
      </button>
    </form>
  );
}
