import { Promo, formatBRL } from "@baruk/shared";
import { useCart } from "../context/CartContext";

type Props = {
  promos: Promo[];
  appliedId: string | null;
  onToggle: (id: string | null) => void;
};

export function PromoSection({ promos, appliedId, onToggle }: Props) {
  const { addLine } = useCart();
  const today = new Date().getDay();

  return (
    <section className="menu-section" id="sec0">
      <h2>Promoções e combos<div className="tri" /></h2>
      <div className="grid">
        {promos.map((p) => {
          const isToday = p.weekday === today;
          return (
            <div key={p.id} className={"promo" + (isToday ? " today" : "")}>
              {isToday && <span className="badge">HOJE</span>}
              <span className="day">{p.label}</span>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              {p.note && <span className="note">{p.note}</span>}
              {p.price ? (
                <button className="price-btn" onClick={() => addLine("promo:" + p.id, `${p.title} (${p.label})`, p.price!)}>
                  <small>+</small>{formatBRL(p.price)}
                </button>
              ) : (
                <button
                  className={"use-btn" + (appliedId === p.id ? " on" : "")}
                  onClick={() => onToggle(appliedId === p.id ? null : p.id)}
                >
                  {appliedId === p.id ? "Promoção aplicada ✓" : "Usar esta promoção"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
