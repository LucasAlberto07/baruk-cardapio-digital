import { FormEvent, useState } from "react";
import { Promo } from "@baruk/shared";
import { useCheckout } from "../../hooks/useCheckout";
import { Customer } from "../../domain/whatsapp";

type Props = { appliedPromo: Promo | null; onSent: () => void };

/** Dados de entrega; ao enviar, registra o pedido e abre o WhatsApp da pizzaria. */
export function CheckoutForm({ appliedPromo, onSent }: Props) {
  const [customer, setCustomer] = useState<Customer>({ name: "", phone: "", address: "", notes: "" });
  const { sendOrder, sending, error } = useCheckout(appliedPromo, onSent);
  const update = (field: keyof Customer) => (value: string) => setCustomer((current) => ({ ...current, [field]: value }));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void sendOrder(customer);
  }

  return (
    <form className="checkout-form" onSubmit={handleSubmit}>
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
