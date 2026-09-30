import { useState } from "react";
import { formatBRL, formatOrderNumber, formatPhone, Order, ORDER_STATUS_LABELS, OrderStatus, toCents } from "@baruk/shared";
import { customerNotificationLink, elapsedSince, formatDateTime, statusActions } from "../domain/orders";
import { StatusBadge } from "./StatusBadge";

type Props = {
  order: Order;
  onChangeStatus: (order: Order, status: OrderStatus) => Promise<void>;
};

/** Resumo do pedido; clicar abre os detalhes e as ações de status. */
export function OrderCard({ order, onChangeStatus }: Props) {
  const [expanded, setExpanded] = useState(false);
  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
  const when = order.completedAt ? `Concluído em ${formatDateTime(order.completedAt)}` : `${formatDateTime(order.createdAt)} · ${elapsedSince(order.createdAt)}`;

  return (
    <article className={"order-card" + (expanded ? " open" : "")}>
      <button className="order-summary" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
        <span className="order-number">{formatOrderNumber(order.number)}</span>
        <span className="order-main">
          <strong>{order.customerName}</strong>
          <span className="muted">{itemCount} {itemCount === 1 ? "item" : "itens"} · {when}</span>
        </span>
        <span className="order-side">
          <StatusBadge status={order.status} />
          <strong>{formatBRL(order.total)}</strong>
        </span>
      </button>
      {expanded && <OrderDetails order={order} onChangeStatus={onChangeStatus} />}
    </article>
  );
}

function OrderDetails({ order, onChangeStatus }: Props) {
  const [updating, setUpdating] = useState(false);

  async function changeTo(status: OrderStatus) {
    setUpdating(true);
    await onChangeStatus(order, status);
    setUpdating(false);
  }

  return (
    <div className="order-details">
      <table>
        <thead><tr><th>Qtd.</th><th>Item</th><th className="num">Subtotal</th></tr></thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td>{item.qty}x</td>
              <td>{item.label}<br /><span className="muted">{formatBRL(item.unitPrice)} cada</span></td>
              <td className="num">{formatBRL((toCents(item.unitPrice) * item.qty) / 100)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr><td colSpan={2}>Total</td><td className="num">{formatBRL(order.total)}</td></tr></tfoot>
      </table>

      <dl className="order-info">
        {order.customerPhone && <><dt>WhatsApp</dt><dd>{formatPhone(order.customerPhone)}</dd></>}
        <dt>Endereço</dt><dd>{order.address}</dd>
        {order.notes && <><dt>Observações</dt><dd>{order.notes}</dd></>}
        <dt>Recebido em</dt><dd>{formatDateTime(order.createdAt)}</dd>
        {order.completedAt && <><dt>Concluído em</dt><dd>{formatDateTime(order.completedAt)}</dd></>}
      </dl>

      <CustomerNotification order={order} />

      <div className="order-actions">
        {statusActions(order.status).map((action) => (
          <button
            key={action.status}
            className={action.primary ? "primary" : "secondary"}
            disabled={updating}
            onClick={() => changeTo(action.status)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Aviso da etapa atual para o cliente: abre o WhatsApp com a mensagem pronta. */
function CustomerNotification({ order }: { order: Order }) {
  const link = customerNotificationLink(order);
  if (!link) return null;

  return (
    <div className="notify">
      <span>Etapa <strong>{ORDER_STATUS_LABELS[order.status]}</strong>: avise o cliente.</span>
      <a className="whatsapp-btn" href={link} target="_blank" rel="noopener noreferrer">Avisar cliente no WhatsApp</a>
    </div>
  );
}
