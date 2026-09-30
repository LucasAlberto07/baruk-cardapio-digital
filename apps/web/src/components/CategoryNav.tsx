import { scrollToSection, useActiveSection } from "../hooks/useActiveSection";

export function CategoryNav({ sections }: { sections: string[] }) {
  const active = useActiveSection(sections.length);

  return (
    <nav className="catnav" aria-label="Categorias">
      <div className="in">
        {sections.map((name, index) => (
          <button key={name} className={index === active ? "on" : ""} onClick={() => scrollToSection(index)}>
            {name}
          </button>
        ))}
      </div>
    </nav>
  );
}
