import { useEffect, useState } from "react";
import { Product } from "@baruk/shared";
import { api } from "../api/client";

type ProductWithCategory = Product & { category: { name: string } };

export function ProductsPage() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingNew, setSavingNew] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const result = await api.products.list();
      setProducts(result);
      setPriceDrafts(Object.fromEntries(result.map((product) => [product.id, product.price.toFixed(2)])));
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Não foi possível carregar os produtos.");
    }
  }
  useEffect(() => { void load(); }, []);

  async function handleAdd() {
    const value = Number(price);
    if (!name.trim() || !categoryName.trim() || !Number.isFinite(value) || value < 0.01 || value > 9999.99 || Math.abs(Math.round(value * 100) - value * 100) > 1e-8) {
      setMessage("Informe nome, categoria e preço entre R$ 0,01 e R$ 9.999,99.");
      return;
    }
    setSavingNew(true);
    setMessage("");
    try {
      await api.products.create({ name: name.trim(), description: description.trim(), price: Math.round(value * 100) / 100, categoryName: categoryName.trim() });
      setName(""); setDescription(""); setPrice(""); setCategoryName("");
      await load();
      setMessage("Produto adicionado ao cardápio.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Não foi possível adicionar o produto.");
    } finally {
      setSavingNew(false);
    }
  }

  async function handlePriceSave(id: string) {
    const value = Number(priceDrafts[id]);
    if (!Number.isFinite(value) || value < 0.01 || value > 9999.99 || Math.abs(Math.round(value * 100) - value * 100) > 1e-8) {
      setMessage("O preço deve ficar entre R$ 0,01 e R$ 9.999,99, com até duas casas decimais.");
      return;
    }
    setSavingId(id);
    setMessage("");
    try {
      const updated = await api.products.update(id, { price: Math.round(value * 100) / 100 });
      setProducts((current) => current.map((product) => product.id === id ? { ...product, price: updated.price } : product));
      setPriceDrafts((current) => ({ ...current, [id]: updated.price.toFixed(2) }));
      setMessage("Preço atualizado no cardápio.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Não foi possível atualizar o preço.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleRemove(id: string) {
    try {
      await api.products.remove(id);
      await load();
      setMessage("Produto excluído.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Não foi possível excluir o produto.");
    }
  }

  const byCategory = products.reduce<Record<string, ProductWithCategory[]>>((acc, p) => {
    (acc[p.category.name] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="panel-wrap">
      <div className="panel">
        <h2>Adicionar item</h2>
        <div className="field">
          <label>Categoria (existente ou nova)</label>
          <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="ex: Bebidas, Sobremesas" />
        </div>
        <div className="field">
          <label>Nome do item</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Coca-Cola 1,5L" />
        </div>
        <div className="field">
          <label>Descrição</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <div className="field">
          <label>Preço (R$)</label>
          <input type="number" min="0.01" max="9999.99" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <button className="primary" onClick={handleAdd} disabled={savingNew}>{savingNew ? "Salvando…" : "Adicionar ao cardápio"}</button>
      </div>

      <div className="panel">
        <h2>Itens cadastrados</h2>
        {message && <p className="notice" role="status">{message}</p>}
        {Object.keys(byCategory).length === 0 && <p className="empty">Nenhum item cadastrado ainda.</p>}
        {Object.entries(byCategory).map(([cat, items]) => (
          <table key={cat}>
            <thead><tr><th colSpan={3}>{cat}</th></tr></thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td className="name">{p.name}<br /><span className="muted">{p.description}</span></td>
                  <td>
                    R$ <input
                      type="number"
                      min="0.01"
                      max="9999.99"
                      step="0.01"
                      value={priceDrafts[p.id] ?? p.price.toFixed(2)}
                      onChange={(e) => setPriceDrafts((current) => ({ ...current, [p.id]: e.target.value }))}
                    />
                    <button className="save-price" onClick={() => handlePriceSave(p.id)} disabled={savingId === p.id}>{savingId === p.id ? "Salvando…" : "Salvar"}</button>
                  </td>
                  <td className="actions">
                    <button className="del" onClick={() => handleRemove(p.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </div>
  );
}
