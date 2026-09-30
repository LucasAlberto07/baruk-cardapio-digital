import { useProducts } from "../hooks/useProducts";
import { failure } from "../domain/feedback";
import { ProductForm } from "../components/ProductForm";
import { ProductList } from "../components/ProductList";
import { FeedbackMessage } from "../components/FeedbackMessage";

export function ProductsPage() {
  const { products, feedback, setFeedback, createProduct, updatePrice, removeProduct } = useProducts();

  return (
    <div className="panel-wrap">
      <ProductForm onCreate={createProduct} />

      <div className="panel">
        <h2>Itens cadastrados</h2>
        <FeedbackMessage feedback={feedback} />
        <ProductList
          products={products}
          onSavePrice={updatePrice}
          onRemove={removeProduct}
          onInvalidPrice={(message) => setFeedback(failure(message))}
        />
      </div>
    </div>
  );
}
