import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@baruk/shared";
import { NewProduct, productsApi, ProductWithCategory } from "../api/products-api";
import { Feedback, failure, success } from "../domain/feedback";

/** Lista de produtos do painel e as ações sobre ela, com o feedback de cada uma. */
export function useProducts() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const reload = useCallback(async () => {
    setProducts(await productsApi.list());
  }, []);

  useEffect(() => {
    reload().catch((cause) => setFeedback(failure(errorMessage(cause, "Não foi possível carregar os produtos."))));
  }, [reload]);

  /** Executa a ação e registra o feedback; devolve se deu certo. */
  async function run(action: () => Promise<unknown>, successText: string, failureText: string): Promise<boolean> {
    setFeedback(null);
    try {
      await action();
      setFeedback(success(successText));
      return true;
    } catch (cause) {
      setFeedback(failure(errorMessage(cause, failureText)));
      return false;
    }
  }

  const createProduct = (product: NewProduct) => run(
    async () => {
      await productsApi.create(product);
      await reload();
    },
    "Produto adicionado ao cardápio.",
    "Não foi possível adicionar o produto.",
  );

  const updatePrice = (id: string, price: number) => run(
    async () => {
      const updated = await productsApi.update(id, { price });
      setProducts((current) => current.map((product) => (product.id === id ? { ...product, price: updated.price } : product)));
    },
    "Preço atualizado no cardápio.",
    "Não foi possível atualizar o preço.",
  );

  const removeProduct = (id: string) => run(
    async () => {
      await productsApi.remove(id);
      setProducts((current) => current.filter((product) => product.id !== id));
    },
    "Produto excluído.",
    "Não foi possível excluir o produto.",
  );

  return { products, feedback, setFeedback, createProduct, updatePrice, removeProduct };
}
