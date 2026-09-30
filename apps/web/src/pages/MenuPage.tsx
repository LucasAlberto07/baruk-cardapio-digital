import { useState } from "react";
import { MenuResponse, Product } from "@baruk/shared";
import { env } from "../config/env";
import { OrganizedMenu } from "../domain/menu";
import { useMenu } from "../hooks/useMenu";
import { Header } from "../components/Header";
import { CategoryNav } from "../components/CategoryNav";
import { PromoSection } from "../components/PromoSection";
import { ProductRail } from "../components/ProductRail";
import { AddOnsModal } from "../components/AddOnsModal";
import { CartBar } from "../components/CartBar";
import { CartDrawer } from "../components/CartDrawer";

export function MenuPage() {
  const state = useMenu();

  if (state.status === "loading") return <p className="wrap" style={{ padding: 40 }}>Carregando cardápio…</p>;
  if (state.status === "error") {
    return (
      <p className="wrap" style={{ padding: 40 }}>
        Não foi possível carregar o cardápio. Confira se a API está rodando em {env.apiUrl}.
      </p>
    );
  }
  return <MenuContent menu={state.menu} organized={state.organized} />;
}

function MenuContent({ menu, organized }: { menu: MenuResponse; organized: OrganizedMenu }) {
  const [addOnsProduct, setAddOnsProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [appliedPromoId, setAppliedPromoId] = useState<string | null>(null);
  const appliedPromo = menu.promos.find((promo) => promo.id === appliedPromoId) ?? null;

  return (
    <>
      <Header />
      <CategoryNav sections={organized.navigation} />
      <div className="wrap">
        <main>
          <PromoSection promos={menu.promos} appliedId={appliedPromoId} onToggle={setAppliedPromoId} />
          {organized.sections.map((section, index) => (
            <ProductRail key={section.category.id} navIndex={index + 1} section={section} onOpenAddOns={setAddOnsProduct} />
          ))}
        </main>
        <Features />
      </div>

      <CartBar onOpen={() => setCartOpen(true)} />

      {addOnsProduct && (
        <AddOnsModal product={addOnsProduct} extras={menu.extras} drinks={organized.drinks} onClose={() => setAddOnsProduct(null)} />
      )}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} appliedPromo={appliedPromo} />}
    </>
  );
}

function Features() {
  return (
    <div className="feats">
      <div><b>Ingredientes</b>selecionados</div>
      <div><b>Qualidade</b>em cada fatia</div>
      <div><b>Feita para</b>bons momentos</div>
    </div>
  );
}
