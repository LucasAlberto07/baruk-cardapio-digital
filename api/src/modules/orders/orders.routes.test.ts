import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { Express } from "express";
import { createTestApp, TEST_ADMIN_KEY, TUESDAY, TUESDAY_NOON } from "../../test-support/test-app";
import { InMemoryRepositories } from "../../test-support/in-memory-repositories";

const customer = { customerName: "Ana", customerPhone: "(11) 91234-5678", address: "Rua A, 1" };

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

  it("guarda o telefone normalizado para os avisos no WhatsApp", async () => {
    const res = await postOrder([{ productId: "costela", qty: 1 }]);
    expect(res.body.customerPhone).toBe("5511912345678");
  });

  it.each([["sem telefone", undefined], ["telefone sem DDD", "91234-5678"], ["telefone numérico", 11912345678]])("rejeita %s", async (_case, customerPhone) => {
    const res = await postOrder([{ productId: "costela", qty: 1 }], { customerPhone });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Informe um telefone válido com DDD, ex.: (11) 91234-5678.");
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

describe("gerenciamento de pedidos (admin)", () => {
  const admin = { "x-admin-key": TEST_ADMIN_KEY };
  const listOrders = (query = "") => request(app).get(`/api/orders${query}`).set(admin);
  const changeStatus = (id: string, status: string) => request(app).patch(`/api/orders/${id}/status`).set(admin).send({ status });

  async function placeOrders(...names: string[]) {
    const created = [];
    for (const customerName of names) created.push((await postOrder([{ productId: "costela", qty: 1 }], { customerName })).body);
    return created;
  }

  it("novo pedido recebe número sequencial e status Recebido", async () => {
    const [first, second] = await placeOrders("Ana", "Bia");
    expect(first).toMatchObject({ number: 1, status: "RECEIVED", completedAt: null });
    expect(second.number).toBe(2);
  });

  it("exige a chave administrativa", async () => {
    expect((await request(app).get("/api/orders")).status).toBe(401);
    expect((await request(app).patch("/api/orders/x/status").send({ status: "COMPLETED" })).status).toBe(401);
  });

  it("lista a fila de abertos do mais antigo para o mais novo", async () => {
    await placeOrders("Ana", "Bia");
    const res = await listOrders();
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 2, page: 1, pageSize: 20, latestOrderNumber: 2 });
    expect(res.body.items.map((order: { customerName: string }) => order.customerName)).toEqual(["Ana", "Bia"]);
  });

  it("mostra os detalhes de um pedido", async () => {
    const [order] = await placeOrders("Ana");
    const res = await request(app).get(`/api/orders/${order.id}`).set(admin);
    expect(res.body).toMatchObject({ number: 1, customerName: "Ana", items: [{ label: "Pizza Costela", qty: 1 }] });
    expect((await request(app).get("/api/orders/nao-existe").set(admin)).status).toBe(404);
  });

  it("concluir move o pedido da fila para o histórico com a data de conclusão", async () => {
    const [ana, bia] = await placeOrders("Ana", "Bia");
    expect((await changeStatus(ana.id, "PREPARING")).body.status).toBe("PREPARING");

    const completed = await changeStatus(ana.id, "COMPLETED");
    expect(completed.status).toBe(200);
    expect(completed.body.completedAt).toBe(TUESDAY_NOON.toISOString());

    expect((await listOrders("?view=open")).body.items.map((order: { id: string }) => order.id)).toEqual([bia.id]);
    const history = await listOrders("?view=history");
    expect(history.body).toMatchObject({ total: 1, items: [{ id: ana.id, status: "COMPLETED" }] });
  });

  it("percorre as etapas avisadas ao cliente até concluir", async () => {
    const [order] = await placeOrders("Ana");
    for (const status of ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"]) {
      const res = await changeStatus(order.id, status);
      expect(res.body).toMatchObject({ status, completedAt: null });
    }
    expect((await listOrders("?view=open")).body.items[0].status).toBe("OUT_FOR_DELIVERY");
    expect((await changeStatus(order.id, "COMPLETED")).body.completedAt).not.toBeNull();
  });

  it("não deixa o status voltar nem repetir", async () => {
    const [order] = await placeOrders("Ana");
    await changeStatus(order.id, "COMPLETED");
    const res = await changeStatus(order.id, "PREPARING");
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('O pedido #0001 está "Concluído" e não pode passar para "Em preparo".');
  });

  it("valida o status enviado", async () => {
    const [order] = await placeOrders("Ana");
    const res = await changeStatus(order.id, "ENTREGUE");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Status inválido/);
  });

  it("busca no histórico por número ou nome do cliente", async () => {
    const orders = await placeOrders("Ana Souza", "Bia", "Carlos");
    for (const order of orders) await changeStatus(order.id, "COMPLETED");

    expect((await listOrders("?view=history&search=%230002")).body.items.map((order: { customerName: string }) => order.customerName)).toEqual(["Bia"]);
    expect((await listOrders("?view=history&search=souza")).body.items.map((order: { customerName: string }) => order.customerName)).toEqual(["Ana Souza"]);
  });

  it("pagina os resultados", async () => {
    await placeOrders("A", "B", "C");
    const res = await listOrders("?page=2&pageSize=2");
    expect(res.body).toMatchObject({ total: 3, page: 2, pageSize: 2 });
    expect(res.body.items).toHaveLength(1);
    expect((await listOrders("?pageSize=500")).status).toBe(400);
  });

  it("respostas da API não ficam em cache no navegador", async () => {
    expect((await listOrders()).headers["cache-control"]).toBe("no-store");
  });
});
