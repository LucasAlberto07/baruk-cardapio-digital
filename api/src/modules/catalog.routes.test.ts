import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { Express } from "express";
import { createTestApp, TEST_ADMIN_KEY } from "../test-support/test-app";

let app: Express;
const admin = () => ({ "x-admin-key": TEST_ADMIN_KEY });

beforeEach(() => {
  ({ app } = createTestApp());
});

describe("categorias", () => {
  it("cria com slug gerado e ordem padrão", async () => {
    const res = await request(app).post("/api/categories").set(admin()).send({ name: "Pizzas Doces" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Pizzas Doces", slug: "pizzas-doces", sortOrder: 999 });
  });

  it("não permite alterar o slug", async () => {
    const { body } = await request(app).post("/api/categories").set(admin()).send({ name: "Bebidas" });
    const res = await request(app).put(`/api/categories/${body.id}`).set(admin()).send({ slug: "outra" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/slug/);
  });

  it("não exclui categoria com produtos", async () => {
    const product = await request(app).post("/api/products").set(admin()).send({ name: "Calabresa", price: 50, categoryName: "Tradicionais" });
    const res = await request(app).delete(`/api/categories/${product.body.categoryId}`).set(admin());
    expect(res.status).toBe(409);
  });
});

describe("produtos", () => {
  it("cria a categoria pelo nome e reaproveita a existente", async () => {
    const first = await request(app).post("/api/products").set(admin()).send({ name: "Calabresa", price: 50, categoryName: "Tradicionais" });
    const second = await request(app).post("/api/products").set(admin()).send({ name: "Mussarela", price: 50, categoryName: "tradicionais" });
    expect(first.status).toBe(201);
    expect(second.body.categoryId).toBe(first.body.categoryId);
    expect(first.body).toMatchObject({ name: "Calabresa", description: "", price: 50, active: true });
  });

  it("devolve a mensagem do campo inválido na atualização", async () => {
    const { body } = await request(app).post("/api/products").set(admin()).send({ name: "Calabresa", price: 50, categoryName: "Tradicionais" });
    const res = await request(app).put(`/api/products/${body.id}`).set(admin()).send({ price: 1.001 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Preço deve ser entre R$ 0,01 e R$ 9.999,99, com até duas casas decimais.");
  });

  it("some do cardápio quando desativado", async () => {
    const { body } = await request(app).post("/api/products").set(admin()).send({ name: "Calabresa", price: 50, categoryName: "Tradicionais" });
    await request(app).put(`/api/products/${body.id}`).set(admin()).send({ active: false });
    const menu = await request(app).get("/api/menu");
    expect(menu.body.products).toHaveLength(0);
    expect(menu.body.categories).toHaveLength(1);
  });

  it("responde 404 ao excluir produto inexistente", async () => {
    expect((await request(app).delete("/api/products/nao-existe").set(admin())).status).toBe(404);
  });
});

describe("promoções", () => {
  it("exige os campos obrigatórios na criação", async () => {
    const res = await request(app).post("/api/promos").set(admin()).send({ weekday: 2, label: "Terça" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Informe dia da semana, rótulo, título e descrição.");
  });

  it("cria com preço e observação opcionais", async () => {
    const res = await request(app).post("/api/promos").set(admin()).send({ weekday: 2, label: "Terça", title: "Combo", description: "2 pizzas", note: "  " });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ price: null, note: null });
  });

  it("valida o dia da semana", async () => {
    const res = await request(app).post("/api/promos").set(admin()).send({ weekday: 7, label: "X", title: "X", description: "X" });
    expect(res.body.error).toBe("Dia da semana deve ser de 0 (domingo) a 6 (sábado).");
  });
});
