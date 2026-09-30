import { Promo, formatBRL, weekdayInSaoPaulo } from "@baruk/shared";
import { useCart } from "../context/CartContext";

type Props = {
  promos: Promo[];
  appliedId: string | null;
  onToggle: (id: string | null) => void;
};

export function PromoSection({ promos, appliedId, onToggle }: Props) {
  const { addLine } = useCart();
  // Mesmo fuso que a API usa para validar a promoção do dia.
  const today = weekdayInSaoPaulo();

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
                // A API só aceita a promoção com preço no dia dela.
                isToday ? (
                  <button className="price-btn" onClick={() => addLine("promo:" + p.id, `${p.title} (${p.label})`, p.price!, 1, { promoId: p.id })}>
                    <small>+</small>{formatBRL(p.price)}
                  </button>
                ) : (
                  <span className="note">Disponível só {p.label.toLowerCase()} · {formatBRL(p.price)}</span>
                )
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
