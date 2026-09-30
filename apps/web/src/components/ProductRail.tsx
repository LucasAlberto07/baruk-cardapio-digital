import { Category, Product, formatBRL, isDrinkCategory } from "@baruk/shared";
import { useCart } from "../context/CartContext";

type Props = {
  index: number;
  category: Category;
  products: Product[];
  onOpenAddOns: (product: Product) => void;
};

export function ProductRail({ index, category, products, onOpenAddOns }: Props) {
  const { addLine } = useCart();
  const isDrinks = isDrinkCategory(category);

  return (
    <section className="menu-section" id={"sec" + (index + 1)}>
      <h2>{category.name}<div className="tri" /></h2>
      <div className="rail">
        {products.map((p) => (
          <div className="card" key={p.id}>
            <div className={isDrinks ? "pz drink" : "pz"} />
            <h3>{p.name}</h3>
            <p>{p.description}</p>
            <button
              className="price-btn"
              onClick={() => (isDrinks ? addLine("bebida:" + p.id, p.name, p.price, 1, { productId: p.id }) : onOpenAddOns(p))}
            >
              <small>+</small>{formatBRL(p.price)}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
