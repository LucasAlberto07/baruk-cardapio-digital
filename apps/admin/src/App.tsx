import { useAdminAuth } from "./hooks/useAdminAuth";
import { AdminLayout } from "./components/AdminLayout";
import { LoginPage } from "./pages/LoginPage";
import { ProductsPage } from "./pages/ProductsPage";

export default function App() {
  const auth = useAdminAuth();

  if (auth.status === "checking") return <div className="page"><p>Verificando acesso…</p></div>;
  if (auth.status === "signedOut") return <LoginPage error={auth.error} onLogin={auth.login} />;

  return (
    <AdminLayout onLogout={auth.logout}>
      <ProductsPage />
    </AdminLayout>
  );
}
