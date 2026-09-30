import { Promo, formatBRL } from "@baruk/shared";
import { useCart } from "../context/CartContext";
import { promoLine } from "../domain/cart-lines";
import { hasPrice, isPromoToday } from "../domain/menu";
import { sectionId } from "../hooks/useActiveSection";

type Props = {
  promos: Promo[];
  appliedId: string | null;
  onToggle: (id: string | null) => void;
};

export function PromoSection({ promos, appliedId, onToggle }: Props) {
  return (
    <section className="menu-section" id={sectionId(0)}>
      <h2>Promoções e combos<div className="tri" /></h2>
      <div className="grid">
        {promos.map((promo) => (
          <PromoCard
            key={promo.id}
            promo={promo}
            applied={appliedId === promo.id}
            onToggle={() => onToggle(appliedId === promo.id ? null : promo.id)}
          />
        ))}
      </div>
    </section>
  );
}

function PromoCard({ promo, applied, onToggle }: { promo: Promo; applied: boolean; onToggle: () => void }) {
  const isToday = isPromoToday(promo);

  return (
    <div className={"promo" + (isToday ? " today" : "")}>
      {isToday && <span className="badge">HOJE</span>}
      <span className="day">{promo.label}</span>
      <h3>{promo.title}</h3>
      <p>{promo.description}</p>
      {promo.note && <span className="note">{promo.note}</span>}
      {hasPrice(promo)
        ? <PromoPriceAction promo={promo} isToday={isToday} />
        : (
          <button className={"use-btn" + (applied ? " on" : "")} onClick={onToggle}>
            {applied ? "Promoção aplicada ✓" : "Usar esta promoção"}
          </button>
        )}
    </div>
  );
}

/** A API só aceita a promoção com preço no dia dela. */
function PromoPriceAction({ promo, isToday }: { promo: Promo & { price: number }; isToday: boolean }) {
  const { addLine } = useCart();

  if (!isToday) return <span className="note">Disponível só {promo.label.toLowerCase()} · {formatBRL(promo.price)}</span>;
  return (
    <button className="price-btn" onClick={() => addLine(promoLine(promo))}>
      <small>+</small>{formatBRL(promo.price)}
    </button>
  );
}
