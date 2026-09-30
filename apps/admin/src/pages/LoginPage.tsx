import { FormEvent, useState } from "react";

type Props = {
  error: string | null;
  onLogin: (key: string) => Promise<void>;
};

export function LoginPage({ error, onLogin }: Props) {
  const [key, setKey] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    await onLogin(key);
    setSubmitting(false);
  }

  return (
    <div className="page">
      <header><h1>Painel do lojista</h1><p>Acesso restrito à administração.</p></header>
      <form className="panel login-panel" onSubmit={handleSubmit}>
        <h2>Entrar</h2>
        <div className="field">
          <label htmlFor="admin-key">Chave administrativa</label>
          <input id="admin-key" type="password" autoComplete="current-password" value={key} onChange={(event) => setKey(event.target.value)} required />
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" type="submit" disabled={submitting}>{submitting ? "Verificando…" : "Acessar painel"}</button>
      </form>
    </div>
  );
}
