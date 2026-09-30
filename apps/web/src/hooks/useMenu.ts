import { useEffect, useState } from "react";
import { MenuResponse } from "@baruk/shared";
import { fetchMenu } from "../api/client";

export function useMenu() {
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMenu()
      .then(setMenu)
      .catch((e) => setError(e.message));
  }, []);

  return { menu, loading: !menu && !error, error };
}
