import { useEffect, useState } from "react";
import { errorMessage, MenuResponse } from "@baruk/shared";
import { fetchMenu } from "../api/menu-api";
import { organizeMenu, OrganizedMenu } from "../domain/menu";

type MenuState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; menu: MenuResponse; organized: OrganizedMenu };

export function useMenu(): MenuState {
  const [state, setState] = useState<MenuState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchMenu()
      .then((menu) => !cancelled && setState({ status: "ready", menu, organized: organizeMenu(menu) }))
      .catch((cause) => !cancelled && setState({ status: "error", error: errorMessage(cause, "Não foi possível carregar o cardápio.") }));
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
