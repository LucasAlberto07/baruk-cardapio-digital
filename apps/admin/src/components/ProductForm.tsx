import { FormEvent, useState } from "react";
import { NewProduct } from "../api/products-api";
import { EMPTY_PRODUCT_FORM, ProductForm as ProductFormValues, validateProductForm } from "../domain/products";
import { Feedback, failure } from "../domain/feedback";
import { FeedbackMessage } from "./FeedbackMessage";

type Props = {
  /** Devolve true quando o produto foi criado (o formulário é limpo). */
  onCreate: (product: NewProduct) => Promise<boolean>;
};

export function ProductForm({ onCreate }: Props) {
  const [form, setForm] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);
  const [error, setError] = useState<Feedback | null>(null);
  const [saving, setSaving] = useState(false);
  const update = (field: keyof ProductFormValues) => (value: string) => setForm((current) => ({ ...current, [field]: value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validateProductForm(form);
    if (!result.ok) return setError(failure(result.error));

    setError(null);
    setSaving(true);
    const created = await onCreate(result.value);
    setSaving(false);
    if (created) setForm(EMPTY_PRODUCT_FORM);
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Adicionar item</h2>
      <div className="field">
        <label htmlFor="product-category">Categoria (existente ou nova)</label>
        <input id="product-category" value={form.categoryName} onChange={(event) => update("categoryName")(event.target.value)} placeholder="ex: Bebidas, Sobremesas" />
      </div>
      <div className="field">
        <label htmlFor="product-name">Nome do item</label>
        <input id="product-name" value={form.name} onChange={(event) => update("name")(event.target.value)} placeholder="ex: Coca-Cola 1,5L" />
      </div>
      <div className="field">
        <label htmlFor="product-description">Descrição</label>
        <textarea id="product-description" value={form.description} onChange={(event) => update("description")(event.target.value)} rows={2} />
      </div>
      <div className="field">
        <label htmlFor="product-price">Preço (R$)</label>
        <input id="product-price" type="number" min="0.01" max="9999.99" step="0.01" value={form.price} onChange={(event) => update("price")(event.target.value)} />
      </div>
      <FeedbackMessage feedback={error} />
      <button className="primary" type="submit" disabled={saving}>{saving ? "Salvando…" : "Adicionar ao cardápio"}</button>
    </form>
  );
}
