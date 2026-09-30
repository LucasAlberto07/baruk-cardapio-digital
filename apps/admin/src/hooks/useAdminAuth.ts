import { useEffect, useState } from "react";
import { errorMessage } from "@baruk/shared";
import { verifyAdminKey } from "../api/auth-api";
import { adminSession } from "../auth/admin-session";

type AuthStatus = "checking" | "signedOut" | "signedIn";

/** Estado de acesso ao painel: revalida a chave salva ao abrir e controla login/logout. */
export function useAdminAuth() {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedKey = adminSession.getKey();
    if (!storedKey) {
      setStatus("signedOut");
      return;
    }
    verifyAdminKey(storedKey)
      .then(() => setStatus("signedIn"))
      .catch(() => {
        adminSession.clear();
        setStatus("signedOut");
      });
  }, []);

  async function login(key: string) {
    setError(null);
    try {
      await verifyAdminKey(key);
      adminSession.save(key);
      setStatus("signedIn");
    } catch (cause) {
      setError(errorMessage(cause, "Não foi possível entrar."));
    }
  }

  function logout() {
    adminSession.clear();
    setStatus("signedOut");
  }

  return { status, error, login, logout };
}
