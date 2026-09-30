import { useEffect, useState } from "react";
import { ProductWithCategory } from "../api/products-api";
import { formatPriceInput, groupByCategory, parsePriceInput, PRICE_RULE_MESSAGE } from "../domain/products";

type Actions = {
  onSavePrice: (id: string, price: number) => Promise<boolean>;
  onRemove: (id: string) => void;
  onInvalidPrice: (message: string) => void;
};

export function ProductList({ products, ...actions }: { products: ProductWithCategory[] } & Actions) {
  const groups = groupByCategory(products);
  if (groups.length === 0) return <p className="empty">Nenhum item cadastrado ainda.</p>;

  return (
    <>
      {groups.map(([categoryName, items]) => (
        <table key={categoryName}>
          <thead><tr><th colSpan={3}>{categoryName}</th></tr></thead>
          <tbody>
            {items.map((product) => <ProductRow key={product.id} product={product} {...actions} />)}
          </tbody>
        </table>
      ))}
    </>
  );
}

function ProductRow({ product, onSavePrice, onRemove, onInvalidPrice }: { product: ProductWithCategory } & Actions) {
  return (
    <tr>
      <td className="name">{product.name}<br /><span className="muted">{product.description}</span></td>
      <td><PriceEditor product={product} onSave={onSavePrice} onInvalid={onInvalidPrice} /></td>
      <td className="actions">
        <button className="del" onClick={() => onRemove(product.id)}>Excluir</button>
      </td>
    </tr>
  );
}

type PriceEditorProps = {
  product: ProductWithCategory;
  onSave: (id: string, price: number) => Promise<boolean>;
  onInvalid: (message: string) => void;
};

/** Campo de preço com rascunho local: só vai para a API ao clicar em Salvar. */
function PriceEditor({ product, onSave, onInvalid }: PriceEditorProps) {
  const [draft, setDraft] = useState(formatPriceInput(product.price));
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(formatPriceInput(product.price)), [product.price]);

  async function save() {
    const price = parsePriceInput(draft);
    if (price === null) return onInvalid(PRICE_RULE_MESSAGE);
    setSaving(true);
    await onSave(product.id, price);
    setSaving(false);
  }

  return (
    <>
      R$ <input
        type="number"
        min="0.01"
        max="9999.99"
        step="0.01"
        aria-label={`Preço de ${product.name}`}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <button className="save-price" onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</button>
    </>
  );
}
