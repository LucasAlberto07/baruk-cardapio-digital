import { useEffect, useState } from "react";

/** Distância do topo (abaixo da barra de navegação fixa) em que uma seção conta como ativa. */
const ACTIVE_OFFSET_PX = 104;

export const sectionId = (index: number) => "sec" + index;

export function scrollToSection(index: number) {
  document.getElementById(sectionId(index))?.scrollIntoView({ behavior: "smooth" });
}

/** Índice da última seção cujo topo já passou da barra de navegação. */
export function useActiveSection(sectionCount: number) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    function updateActive() {
      let current = 0;
      for (let index = 0; index < sectionCount; index++) {
        const element = document.getElementById(sectionId(index));
        if (element && element.getBoundingClientRect().top <= ACTIVE_OFFSET_PX) current = index;
      }
      setActive(current);
    }

    window.addEventListener("scroll", updateActive, { passive: true });
    updateActive();
    return () => window.removeEventListener("scroll", updateActive);
  }, [sectionCount]);

  return active;
}
