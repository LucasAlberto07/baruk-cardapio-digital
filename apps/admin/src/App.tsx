import { useState } from "react";
import { OrderView } from "@baruk/shared";
import { useAdminAuth } from "./hooks/useAdminAuth";
import { AdminLayout, AdminSection } from "./components/AdminLayout";
import { LoginPage } from "./pages/LoginPage";
import { OrdersPage } from "./pages/OrdersPage";
import { ProductsPage } from "./pages/ProductsPage";
import { useNewOrderAlert } from "./hooks/useNewOrderAlert";

export default function App() {
  const auth = useAdminAuth();

  if (auth.status === "checking") return <div className="page"><p>Verificando acesso…</p></div>;
  if (auth.status === "signedOut") return <LoginPage error={auth.error} onLogin={auth.login} />;
  return <AdminPanel onLogout={auth.logout} />;
}

/** Só existe depois do login: o alerta de pedidos novos precisa da chave administrativa. */
function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [section, setSection] = useState<AdminSection>("orders");
  const [orderView, setOrderView] = useState<OrderView>("open");
  const alert = useNewOrderAlert();

  function viewNewOrders() {
    setSection("orders");
    setOrderView("open");
    alert.dismiss();
  }

  return (
    <AdminLayout section={section} onNavigate={setSection} onLogout={onLogout} alert={alert} onViewNewOrders={viewNewOrders}>
      {section === "orders"
        ? <OrdersPage view={orderView} onChangeView={setOrderView} />
        : <ProductsPage />}
    </AdminLayout>
  );
}
