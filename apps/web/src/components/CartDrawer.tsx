import { useState } from "react";
import { formatBRL, OrderPayload } from "@baruk/shared";
import { useCart } from "../context/CartContext";
import { ApiError, submitOrder } from "../api/client";
import { Promo } from "@baruk/shared";

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? "5500000000000";

type Props = { open: boolean; onClose: () => void; appliedPromo: Promo | null };

export function CartDrawer({ open, onClose, appliedPromo }: Props) {
  const { lines, changeQty, totalPrice, clear } = useCart();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  if (!open) return null;

  async function handleSend() {
    if (!name.trim() || !address.trim()) {
      alert("Informe seu nome e o endereço de entrega.");
      return;
    }

    const items: OrderPayload["items"] = lines.map((line) => line.promoId
      ? { promoId: line.promoId, qty: line.qty }
      : {
          productId: line.productId,
          qty: line.qty,
          extraIds: line.extraIds,
          drinkProductId: line.drinkProductId,
          slice: line.slice,
        });
    const payload: OrderPayload = { customerName: name, address, notes, items };

    let confirmedOrder: { total: number; items: { label: string; qty: number; unitPrice: number }[] } | null = null;
    try {
      confirmedOrder = await submitOrder(payload);
    } catch (error) {
      if (error instanceof ApiError) {
        alert(error.message);
        return;
      }
      // Mesmo se o backend estiver fora do ar, o pedido ainda pode ir pelo WhatsApp.
    }

    const orderLines = confirmedOrder
      ? confirmedOrder.items.map((item) => `• ${item.qty}x ${item.label} — ${formatBRL(Math.round(item.qty * item.unitPrice * 100) / 100)}`)
      : lines.map((line) => `• ${line.qty}x ${line.label} — ${formatBRL(Math.round(line.qty * line.unitPrice * 100) / 100)}`);
    const confirmedTotal = confirmedOrder?.total ?? totalPrice;
    let msg = `*Novo pedido — Baruk Pizzaria & Esfiharia*\n\n${orderLines.join("\n")}\n\n*Total:* ${formatBRL(confirmedTotal)}`;
    if (appliedPromo) msg += `\n*Promoção:* ${appliedPromo.label} — ${appliedPromo.title} (${appliedPromo.description})`;
    msg += `\n\n*Nome:* ${name}\n*Endereço:* ${address}` + (notes ? `\n*Obs:* ${notes}` : "");

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    clear();
    onClose();
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
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
            {lines.map((l) => (
              <div className="line" key={l.key}>
                <span>{l.label}</span>
                <div className="qty">
                  <button onClick={() => changeQty(l.key, -1)}>−</button>
                  <span>{l.qty}</span>
                  <button onClick={() => changeQty(l.key, 1)}>+</button>
                </div>
              </div>
            ))}
            <div className="total"><span>Total</span><span>{formatBRL(totalPrice)}</span></div>

            <div className="field">
              <label>Seu nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>
            <div className="field">
              <label>Endereço de entrega</label>
              <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
            </div>
            <div className="field">
              <label>Observações (opcional)</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button className="send-btn" onClick={handleSend}>Enviar pedido no WhatsApp</button>
          </>
        )}
      </div>
    </div>
  );
}
