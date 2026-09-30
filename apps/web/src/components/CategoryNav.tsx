import { useEffect, useState } from "react";

export function CategoryNav({ sections }: { sections: string[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    function onScroll() {
      const y = 104;
      let idx = 0;
      sections.forEach((_, i) => {
        const el = document.getElementById("sec" + i);
        if (el && el.getBoundingClientRect().top <= y) idx = i;
      });
      setActive(idx);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  return (
    <nav className="catnav" aria-label="Categorias">
      <div className="in">
        {sections.map((name, i) => (
          <button
            key={name}
            className={i === active ? "on" : ""}
            onClick={() => document.getElementById("sec" + i)?.scrollIntoView({ behavior: "smooth" })}
          >
            {name}
          </button>
        ))}
      </div>
    </nav>
  );
}
