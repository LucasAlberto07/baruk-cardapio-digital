import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { Express } from "express";
import { createTestApp, TEST_ADMIN_KEY, TUESDAY } from "../../test-support/test-app";
import { InMemoryRepositories } from "../../test-support/in-memory-repositories";

const customer = { customerName: "Ana", address: "Rua A, 1" };

let app: Express;
let repositories: InMemoryRepositories;

beforeEach(() => {
  ({ app, repositories } = createTestApp());
  const pizzas = repositories.categories.table.insert({ id: "especiais", name: "Especiais", slug: "especiais", sortOrder: 1 });
  const bebidas = repositories.categories.table.insert({ id: "bebidas", name: "Bebidas", slug: "bebidas", sortOrder: 2 });
  const now = new Date();
  repositories.products.table.insert({ id: "costela", name: "Costela", description: "", price: 79.99, active: true, categoryId: pizzas.id, createdAt: now, updatedAt: now });
  repositories.products.table.insert({ id: "sprite", name: "Sprite 2L", description: "", price: 14, active: true, categoryId: bebidas.id, createdAt: now, updatedAt: now });
  repositories.products.table.insert({ id: "antiga", name: "Antiga", description: "", price: 50, active: false, categoryId: pizzas.id, createdAt: now, updatedAt: now });
  repositories.extras.table.insert({ id: "alho", name: "Alho", price: 6 });
  repositories.promos.table.insert({ id: "terca", weekday: TUESDAY, label: "Terça", title: "Combo", description: "", price: 89.9, note: null });
  repositories.promos.table.insert({ id: "quarta", weekday: TUESDAY + 1, label: "Quarta", title: "Combo", description: "", price: 89.9, note: null });
});

const postOrder = (items: unknown[], extra: object = {}) => request(app).post("/api/orders").send({ ...customer, ...extra, items });

describe("POST /api/orders", () => {
  it("calcula o total no servidor e grava o pedido", async () => {
    const res = await postOrder([{ productId: "costela", qty: 3, extraIds: ["alho"], drinkProductId: "sprite", slice: "8 fatias" }]);
    expect(res.status).toBe(201);
    expect(res.body.total).toBe(299.97);
    expect(res.body.items[0]).toMatchObject({ label: "Pizza Costela (8 fatias) + Alho + Sprite 2L", qty: 3, unitPrice: 99.99 });
    expect(repositories.orders.table.rows).toHaveLength(1);
  });

  it("guarda observações sem espaços e vazias como null", async () => {
    expect((await postOrder([{ productId: "costela", qty: 1 }], { notes: "  sem cebola " })).body.notes).toBe("sem cebola");
    expect((await postOrder([{ productId: "costela", qty: 1 }], { notes: "   " })).body.notes).toBeNull();
  });

  it("aceita a promoção do dia com o preço do banco", async () => {
    const res = await postOrder([{ promoId: "terca", qty: 2 }]);
    expect(res.status).toBe(201);
    expect(res.body.total).toBe(179.8);
    expect(res.body.items[0]).toMatchObject({ label: "Combo (Terça)", unitPrice: 89.9 });
  });

  it.each([
    ["pedido sem itens", [], "Pedido inválido: informe cliente, endereço e de 1 a 30 itens."],
    ["quantidade inválida", [{ productId: "costela", qty: 0 }], "Um ou mais itens do pedido são inválidos."],
    ["promoId e productId juntos", [{ promoId: "terca", productId: "costela", qty: 1 }], "Um ou mais itens do pedido são inválidos."],
    ["adicional repetido", [{ productId: "costela", qty: 1, extraIds: ["alho", "alho"] }], "Um ou mais itens do pedido são inválidos."],
    ["produto inativo", [{ productId: "antiga", qty: 1 }], "O cardápio mudou ou contém uma opção indisponível. Atualize a página e tente novamente."],
    ["promoção de outro dia", [{ promoId: "quarta", qty: 1 }], "Essa promoção não está disponível hoje."],
    ["bebida com adicionais", [{ productId: "sprite", qty: 1, extraIds: ["alho"] }], "Uma ou mais combinações de adicionais/bebidas são inválidas."],
    ["pizza como acompanhamento", [{ productId: "costela", qty: 1, drinkProductId: "costela" }], "Uma ou mais combinações de adicionais/bebidas são inválidas."],
  ])("rejeita %s", async (_case, items, message) => {
    const res = await postOrder(items);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(message);
    expect(repositories.orders.table.rows).toHaveLength(0);
  });

  it("limita a 10 pedidos por IP a cada 15 minutos", async () => {
    for (let i = 0; i < 10; i++) expect((await postOrder([{ productId: "costela", qty: 1 }])).status).toBe(201);
    const blocked = await postOrder([{ productId: "costela", qty: 1 }]);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/Muitos pedidos/);
  });
});

describe("GET /api/orders", () => {
  it("lista os pedidos mais recentes para o admin", async () => {
    await postOrder([{ productId: "costela", qty: 1 }]);
    const res = await request(app).get("/api/orders").set("x-admin-key", TEST_ADMIN_KEY);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});
