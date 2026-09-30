import { ORDER_STATUS_LABELS, OrderStatus } from "@baruk/shared";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status status-${status.toLowerCase()}`}>{ORDER_STATUS_LABELS[status]}</span>;
}
