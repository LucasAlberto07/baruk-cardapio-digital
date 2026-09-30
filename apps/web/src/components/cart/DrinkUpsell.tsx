import { Product, formatBRL } from "@baruk/shared";
import { useCart } from "../../context/CartContext";
import { drinkLine } from "../../domain/cart-lines";
import { drinkVolume } from "../../domain/menu";

/** "Que tal uma bebida?": um toque adiciona a bebida ao pedido. */
export function DrinkUpsell({ drinks }: { drinks: Product[] }) {
  const { addLine } = useCart();
  if (drinks.length === 0) return null;

  return (
    <section className="upsell" aria-labelledby="upsell-title">
      <h3 id="upsell-title">Que tal uma bebida?</h3>
      <div className="upsell-rail">
        {drinks.map((drink) => {
          const volume = drinkVolume(drink.name);
          return (
            <button key={drink.id} className="upsell-card" onClick={() => addLine(drinkLine(drink))} aria-label={`Adicionar ${drink.name}`}>
              <span className="upsell-thumb">
                <span className="pz drink" aria-hidden />
                {volume && <span className="volume">{volume}</span>}
              </span>
              <span className="upsell-name">{drink.name}</span>
              <strong>{formatBRL(drink.price)}</strong>
            </button>
          );
        })}
      </div>
    </section>
  );
}
