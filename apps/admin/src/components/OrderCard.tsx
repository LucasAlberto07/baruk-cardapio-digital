import { useState } from "react";
import { formatBRL, formatOrderNumber, nextOrderStatuses, Order, OrderStatus, toCents } from "@baruk/shared";
import { elapsedSince, formatDateTime, STATUS_ACTION_LABELS } from "../domain/orders";
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
        <dt>Endereço</dt><dd>{order.address}</dd>
        {order.notes && <><dt>Observações</dt><dd>{order.notes}</dd></>}
        <dt>Recebido em</dt><dd>{formatDateTime(order.createdAt)}</dd>
        {order.completedAt && <><dt>Concluído em</dt><dd>{formatDateTime(order.completedAt)}</dd></>}
      </dl>

      <div className="order-actions">
        {nextOrderStatuses(order.status).map((status) => (
          <button
            key={status}
            className={status === "COMPLETED" ? "primary" : "secondary"}
            disabled={updating}
            onClick={() => changeTo(status)}
          >
            {STATUS_ACTION_LABELS[status]}
          </button>
        ))}
      </div>
    </div>
  );
}
