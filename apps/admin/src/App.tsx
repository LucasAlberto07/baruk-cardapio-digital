import { FormEvent, useEffect, useState } from "react";
import { ProductsPage } from "./pages/ProductsPage";
import { api } from "./api/client";

export default function App() {
  const [key, setKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedKey = sessionStorage.getItem("baruk-admin-key");
    if (!storedKey) {
      setLoading(false);
      return;
    }
    api.admin.login(storedKey)
      .then(() => setAuthenticated(true))
      .catch(() => sessionStorage.removeItem("baruk-admin-key"))
      .finally(() => setLoading(false));
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api.admin.login(key);
      sessionStorage.setItem("baruk-admin-key", key);
      setAuthenticated(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível entrar.");
    }
  }

  if (loading) return <div className="page"><p>Verificando acesso…</p></div>;
  if (!authenticated) return (
    <div className="page">
      <header><h1>Painel do lojista</h1><p>Acesso restrito à administração.</p></header>
      <form className="panel login-panel" onSubmit={login}>
        <h2>Entrar</h2>
        <div className="field"><label htmlFor="admin-key">Chave administrativa</label><input id="admin-key" type="password" autoComplete="current-password" value={key} onChange={(event) => setKey(event.target.value)} required /></div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" type="submit">Acessar painel</button>
      </form>
    </div>
  );

  return (
    <div className="page">
      <header>
        <h1>Painel do lojista</h1>
        <p>Adicione sabores, bebidas e ajuste preços — o cardápio do cliente atualiza sozinho.</p>
        <button className="logout" onClick={() => { sessionStorage.removeItem("baruk-admin-key"); setAuthenticated(false); }}>Sair</button>
      </header>
      <ProductsPage />
    </div>
  );
}
