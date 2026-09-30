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
import { CartSheet } from "../components/cart/CartSheet";
import { CartLine } from "../domain/cart";

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

/** Pizza aberta no modal de adicionais: nova, ou um item do carrinho sendo editado. */
type PizzaEditor = { product: Product; editing: CartLine | null };

function MenuContent({ menu, organized }: { menu: MenuResponse; organized: OrganizedMenu }) {
  const [pizzaEditor, setPizzaEditor] = useState<PizzaEditor | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [appliedPromoId, setAppliedPromoId] = useState<string | null>(null);
  const appliedPromo = menu.promos.find((promo) => promo.id === appliedPromoId) ?? null;

  function editCartLine(line: CartLine) {
    if (line.item.kind !== "product") return;
    const { productId } = line.item;
    const product = menu.products.find((candidate) => candidate.id === productId);
    if (product) setPizzaEditor({ product, editing: line });
  }

  return (
    <>
      <Header />
      <CategoryNav sections={organized.navigation} />
      <div className="wrap">
        <main>
          <PromoSection promos={menu.promos} appliedId={appliedPromoId} onToggle={setAppliedPromoId} />
          {organized.sections.map((section, index) => (
            <ProductRail key={section.category.id} navIndex={index + 1} section={section} onOpenAddOns={(product) => setPizzaEditor({ product, editing: null })} />
          ))}
        </main>
        <Features />
      </div>

      <CartBar onOpen={() => setCartOpen(true)} />

      {cartOpen && (
        <CartSheet appliedPromo={appliedPromo} drinks={organized.drinks} onEditLine={editCartLine} onClose={() => setCartOpen(false)} />
      )}
      {/* Depois do carrinho: ao editar um item, o modal abre por cima dele. */}
      {pizzaEditor && (
        <AddOnsModal
          key={pizzaEditor.editing?.key ?? pizzaEditor.product.id}
          product={pizzaEditor.product}
          editing={pizzaEditor.editing}
          extras={menu.extras}
          drinks={organized.drinks}
          onClose={() => setPizzaEditor(null)}
        />
      )}
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
