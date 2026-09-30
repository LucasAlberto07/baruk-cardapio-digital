import { useState } from "react";
import { Product } from "@baruk/shared";
import { useMenu } from "./hooks/useMenu";
import { CartProvider, useCart } from "./context/CartContext";
import { Header } from "./components/Header";
import { CategoryNav } from "./components/CategoryNav";
import { PromoSection } from "./components/PromoSection";
import { ProductRail } from "./components/ProductRail";
import { AddOnsModal } from "./components/AddOnsModal";
import { CartDrawer } from "./components/CartDrawer";
import { formatBRL } from "@baruk/shared";

function CardapioContent() {
  const { menu, loading, error } = useMenu();
  const { totalItems, totalPrice } = useCart();
  const [addOnsProduct, setAddOnsProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [appliedPromoId, setAppliedPromoId] = useState<string | null>(null);

  if (loading) return <p className="wrap" style={{ padding: 40 }}>Carregando cardápio…</p>;
  if (error || !menu) {
    return (
      <p className="wrap" style={{ padding: 40 }}>
        Não foi possível carregar o cardápio. Confira se a API está rodando em{" "}
        {import.meta.env.VITE_API_URL ?? "http://localhost:3001"}.
      </p>
    );
  }

  const categories = menu.categories.filter((c) => c.slug !== "bebidas").concat(
    menu.categories.filter((c) => c.slug === "bebidas")
  );
  const drinks = menu.products.filter((p) => p.categoryId === menu.categories.find((c) => c.slug === "bebidas")?.id);
  const sections = ["Promoções", ...categories.map((c) => c.name)];
  const appliedPromo = menu.promos.find((p) => p.id === appliedPromoId) ?? null;

  return (
    <>
      <Header />
      <CategoryNav sections={sections} />
      <div className="wrap">
        <main>
          <PromoSection promos={menu.promos} appliedId={appliedPromoId} onToggle={setAppliedPromoId} />
          {categories.map((cat, i) => (
            <ProductRail
              key={cat.id}
              index={i}
              category={cat}
              products={menu.products.filter((p) => p.categoryId === cat.id)}
              onOpenAddOns={setAddOnsProduct}
            />
          ))}
        </main>
        <div className="feats">
          <div><b>Ingredientes</b>selecionados</div>
          <div><b>Qualidade</b>em cada fatia</div>
          <div><b>Feita para</b>bons momentos</div>
        </div>
      </div>

      {totalItems > 0 && (
        <div className="bar">
          <button onClick={() => setCartOpen(true)}>
            <span>{totalItems} {totalItems === 1 ? "item" : "itens"}</span>
            <span>Ver pedido · {formatBRL(totalPrice)}</span>
          </button>
        </div>
      )}

      {addOnsProduct && (
        <AddOnsModal
          product={addOnsProduct}
          extras={menu.extras}
          drinks={drinks}
          onClose={() => setAddOnsProduct(null)}
        />
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} appliedPromo={appliedPromo} />
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <CardapioContent />
    </CartProvider>
  );
}
