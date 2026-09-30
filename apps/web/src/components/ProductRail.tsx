import { Product, formatBRL } from "@baruk/shared";
import { useCart } from "../context/CartContext";
import { drinkLine } from "../domain/cart-lines";
import { MenuSection } from "../domain/menu";
import { sectionId } from "../hooks/useActiveSection";

type Props = {
  /** Posição na navegação (a seção 0 é a de promoções). */
  navIndex: number;
  section: MenuSection;
  onOpenAddOns: (product: Product) => void;
};

export function ProductRail({ navIndex, section, onOpenAddOns }: Props) {
  const { addLine } = useCart();
  // Bebida vai direto ao carrinho; pizza abre o modal de adicionais.
  const choose = (product: Product) => (section.isDrinks ? addLine(drinkLine(product)) : onOpenAddOns(product));

  return (
    <section className="menu-section" id={sectionId(navIndex)}>
      <h2>{section.category.name}<div className="tri" /></h2>
      <div className="rail">
        {section.products.map((product) => (
          <ProductCard key={product.id} product={product} isDrink={section.isDrinks} onChoose={() => choose(product)} />
        ))}
      </div>
    </section>
  );
}

function ProductCard({ product, isDrink, onChoose }: { product: Product; isDrink: boolean; onChoose: () => void }) {
  return (
    <div className="card">
      <div className={isDrink ? "pz drink" : "pz"} />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <button className="price-btn" onClick={onChoose}>
        <small>+</small>{formatBRL(product.price)}
      </button>
    </div>
  );
}
