import { ReactNode } from "react";
import { formatOrderNumber } from "@baruk/shared";

export type AdminSection = "orders" | "menu";

const SECTIONS: { section: AdminSection; label: string }[] = [
  { section: "orders", label: "Pedidos" },
  { section: "menu", label: "Cardápio" },
];

type NewOrderAlert = { newCount: number; latestNumber: number | null; dismiss: () => void };

type Props = {
  section: AdminSection;
  onNavigate: (section: AdminSection) => void;
  onLogout: () => void;
  alert: NewOrderAlert;
  onViewNewOrders: () => void;
  children: ReactNode;
};

export function AdminLayout({ section, onNavigate, onLogout, alert, onViewNewOrders, children }: Props) {
  return (
    <div className="page">
      <header>
        <h1>Painel do lojista</h1>
        <p>Acompanhe os pedidos e ajuste o cardápio — o site do cliente atualiza sozinho.</p>
        <button className="logout" onClick={onLogout}>Sair</button>
      </header>

      <nav className="admin-nav" aria-label="Seções do painel">
        {SECTIONS.map((item) => (
          <button key={item.section} className={section === item.section ? "on" : ""} onClick={() => onNavigate(item.section)}>
            {item.label}
            {item.section === "orders" && alert.newCount > 0 && <span className="count">{alert.newCount}</span>}
          </button>
        ))}
      </nav>

      {alert.newCount > 0 && (
        <div className="new-orders" role="status">
          <span>
            <strong>{alert.newCount === 1 ? "Novo pedido!" : `${alert.newCount} novos pedidos!`}</strong>
            {alert.latestNumber !== null && ` Último: ${formatOrderNumber(alert.latestNumber)}`}
          </span>
          <span>
            <button className="primary" onClick={onViewNewOrders}>Ver pedidos</button>
            <button className="link" onClick={alert.dismiss}>Dispensar</button>
          </span>
        </div>
      )}

      {children}
    </div>
  );
}
