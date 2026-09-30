import { OrderView } from "@baruk/shared";
import { ORDERS_PAGE_SIZE, useOrders } from "../hooks/useOrders";
import { totalPages } from "../domain/orders";
import { FeedbackMessage } from "../components/FeedbackMessage";
import { OrderCard } from "../components/OrderCard";
import { Pagination } from "../components/Pagination";
import { SearchBox } from "../components/SearchBox";

const VIEWS: { view: OrderView; label: string; empty: string }[] = [
  { view: "open", label: "Em aberto", empty: "Nenhum pedido em aberto. Os novos aparecem aqui automaticamente." },
  { view: "history", label: "Histórico", empty: "Nenhum pedido concluído encontrado." },
];

type Props = { view: OrderView; onChangeView: (view: OrderView) => void };

export function OrdersPage({ view, onChangeView }: Props) {
  return (
    <div className="panel">
      <div className="tabs" role="tablist">
        {VIEWS.map((option) => (
          <button
            key={option.view}
            role="tab"
            aria-selected={view === option.view}
            className={view === option.view ? "tab on" : "tab"}
            onClick={() => onChangeView(option.view)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {/* key recria a lista ao trocar de aba: busca e página começam do zero. */}
      <OrderList key={view} view={view} />
    </div>
  );
}

function OrderList({ view }: { view: OrderView }) {
  const { orders, total, page, setPage, search, changeSearch, loading, feedback, changeStatus } = useOrders(view);
  const empty = VIEWS.find((option) => option.view === view)!.empty;

  return (
    <>
      <SearchBox value={search} placeholder="Buscar por número (#0042) ou nome do cliente" onSearch={changeSearch} />
      <FeedbackMessage feedback={feedback} />
      <p className="muted list-count">{loading ? "Carregando…" : `${total} ${total === 1 ? "pedido" : "pedidos"}`}</p>

      {!loading && orders.length === 0 && <p className="empty">{empty}</p>}
      <div className="order-list">
        {orders.map((order) => <OrderCard key={order.id} order={order} onChangeStatus={changeStatus} />)}
      </div>

      <Pagination page={page} pageCount={totalPages(total, ORDERS_PAGE_SIZE)} onChange={setPage} />
    </>
  );
}
