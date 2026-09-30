import { ReactNode } from "react";

export function AdminLayout({ onLogout, children }: { onLogout: () => void; children: ReactNode }) {
  return (
    <div className="page">
      <header>
        <h1>Painel do lojista</h1>
        <p>Adicione sabores, bebidas e ajuste preços — o cardápio do cliente atualiza sozinho.</p>
        <button className="logout" onClick={onLogout}>Sair</button>
      </header>
      {children}
    </div>
  );
}
