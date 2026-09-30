import { useMemo, useState } from "react";
import { Product, Extra, formatBRL, unitPriceCents } from "@baruk/shared";
import { useCart } from "../context/CartContext";

const FATIAS = ["8 fatias", "12 fatias"] as const;

type Props = {
  product: Product;
  extras: Extra[];
  drinks: Product[];
  onClose: () => void;
};

export function AddOnsModal({ product, extras, drinks, onClose }: Props) {
  const { addLine } = useCart();
  const [qty, setQty] = useState(1);
  const [fatia, setFatia] = useState<(typeof FATIAS)[number]>(FATIAS[0]);
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [drinkId, setDrinkId] = useState<string>("none");

  // Mesma conta que a API usa para cobrar o pedido.
  const unit = useMemo(() => {
    const extraPrices = extras.filter((e) => selectedExtras.has(e.id)).map((e) => e.price);
    const drink = drinks.find((d) => d.id === drinkId);
    return unitPriceCents({ base: product.price, extras: extraPrices, drink: drink?.price ?? null }) / 100;
  }, [selectedExtras, drinkId, extras, drinks, product.price]);

  function toggleExtra(id: string) {
    setSelectedExtras((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function confirm() {
    const extraNames = [...selectedExtras]
      .map((id) => extras.find((e) => e.id === id)?.name)
      .filter(Boolean)
      .sort();
    const drink = drinks.find((d) => d.id === drinkId);

    let label = `Pizza ${product.name} (${fatia})`;
    if (extraNames.length) label += " + " + extraNames.join(", ");
    if (drink) label += " + " + drink.name;

    const key = ["pizza", product.id, fatia, extraNames.join(","), drinkId].join(":");
    addLine(key, label, unit, qty, {
      productId: product.id,
      extraIds: [...selectedExtras],
      drinkProductId: drink?.id ?? null,
      slice: fatia,
    });
    onClose();
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="am-panel">
        <header>
          <div>
            <h2>Adicionais — {product.name}</h2>
            <p className="am-sub">Incremente sua pizza</p>
          </div>
          <button className="close-btn" style={{ position: "static" }} onClick={onClose} aria-label="Fechar">×</button>
        </header>

        <div className="am-scroll">
          <div className="am-group-head"><span>Quantas fatias?</span><span className="hint">({fatia})</span></div>
          {FATIAS.map((f) => (
            <label className="am-row" key={f}>
              <input type="radio" name="fatia" checked={fatia === f} onChange={() => setFatia(f)} />
              <div className="info"><strong>{f}</strong></div>
            </label>
          ))}

          <div className="am-group-head"><span>Adicionais</span><span className="hint">Incremente sua pizza</span></div>
          {extras.map((e) => (
            <label className="am-row" key={e.id}>
              <input type="checkbox" checked={selectedExtras.has(e.id)} onChange={() => toggleExtra(e.id)} />
              <div className="info"><strong>{e.name}</strong><span>+{formatBRL(e.price)}</span></div>
            </label>
          ))}

          <div className="am-group-head"><span>Refrigerante</span><span className="req">*Obrigatório</span></div>
          <label className="am-row">
            <input type="radio" name="drink" checked={drinkId === "none"} onChange={() => setDrinkId("none")} />
            <div className="info"><strong>Não precisa</strong></div>
          </label>
          {drinks.map((d) => (
            <label className="am-row" key={d.id}>
              <input type="radio" name="drink" checked={drinkId === d.id} onChange={() => setDrinkId(d.id)} />
              <div className="info"><strong>{d.name}</strong><span>+{formatBRL(d.price)}</span></div>
            </label>
          ))}
        </div>

        <div className="am-bar">
          <div className="am-qty">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span>{qty}</span>
            <button onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
          <button className="am-add" onClick={confirm}>
            <span className="l1">Adicionar ao pedido</span>
            <span className="l2">Valor: {formatBRL(Math.round(unit * 100) * qty / 100)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
