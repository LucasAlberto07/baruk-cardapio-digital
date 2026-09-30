import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { weekdayInSaoPaulo } from "@baruk/shared";

const db = vi.hoisted(() => ({
  product: { findMany: vi.fn() },
  extra: { findMany: vi.fn() },
  promo: { findMany: vi.fn() },
  order: { create: vi.fn() },
}));
vi.mock("../lib/prisma", () => ({ prisma: db }));

import { createApp } from "../app";

const pizzas = { id: "cat-p", slug: "especiais" };
const bebidas = { id: "cat-b", slug: "bebidas" };
// Preços como string imitam o Decimal do Prisma.
const PRODUCTS = [
  { id: "costela", name: "Costela", price: "79.99", active: true, category: pizzas },
  { id: "sprite", name: "Sprite 2L", price: "14.00", active: true, category: bebidas },
];
const EXTRAS = [{ id: "alho", name: "Alho", price: "6.00" }];

const base = { customerName: "Ana", address: "Rua A, 1" };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_API_KEY = "k".repeat(32);
  db.product.findMany.mockImplementation(async ({ where }: { where: { id: { in: string[] } } }) =>
    PRODUCTS.filter((product) => where.id.in.includes(product.id)));
  db.extra.findMany.mockImplementation(async ({ where }: { where: { id: { in: string[] } } }) =>
    EXTRAS.filter((extra) => where.id.in.includes(extra.id)));
  db.promo.findMany.mockResolvedValue([]);
  db.order.create.mockImplementation(async ({ data }: { data: { total: number; items: { create: object[] } } }) =>
    ({ id: "o1", ...data, items: data.items.create }));
});

describe("POST /api/orders", () => {
  it("calcula o total no servidor em centavos", async () => {
    const res = await request(createApp()).post("/api/orders").send({
      ...base,
      items: [{ productId: "costela", qty: 3, extraIds: ["alho"], drinkProductId: "sprite", slice: "8 fatias" }],
    });
    expect(res.status).toBe(201);
    expect(res.body.total).toBe(299.97);
    expect(res.body.items[0]).toMatchObject({ label: "Pizza Costela (8 fatias) + Alho + Sprite 2L", qty: 3, unitPrice: 99.99 });
  });

  it("rejeita produto inexistente ou inativo", async () => {
    const res = await request(createApp()).post("/api/orders").send({ ...base, items: [{ productId: "sumiu", qty: 1 }] });
    expect(res.status).toBe(400);
    expect(db.order.create).not.toHaveBeenCalled();
  });

  it("rejeita bebida com adicionais", async () => {
    const res = await request(createApp()).post("/api/orders").send({ ...base, items: [{ productId: "sprite", qty: 1, extraIds: ["alho"] }] });
    expect(res.status).toBe(400);
  });

  it("aceita a promoção do dia com o preço do banco", async () => {
    db.promo.findMany.mockResolvedValue([{ id: "promo1", weekday: weekdayInSaoPaulo(), label: "Terça", title: "Combo", price: "89.90" }]);
    const res = await request(createApp()).post("/api/orders").send({ ...base, items: [{ promoId: "promo1", qty: 2 }] });
    expect(res.status).toBe(201);
    expect(res.body.total).toBe(179.8);
    expect(res.body.items[0]).toMatchObject({ label: "Combo (Terça)", unitPrice: 89.9 });
  });

  it("rejeita promoção de outro dia", async () => {
    db.promo.findMany.mockResolvedValue([{ id: "promo1", weekday: (weekdayInSaoPaulo() + 1) % 7, label: "X", title: "Combo", price: "89.90" }]);
    const res = await request(createApp()).post("/api/orders").send({ ...base, items: [{ promoId: "promo1", qty: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/não está disponível hoje/);
  });

  it("rejeita item com promoId e productId ao mesmo tempo", async () => {
    const res = await request(createApp()).post("/api/orders").send({ ...base, items: [{ promoId: "promo1", productId: "costela", qty: 1 }] });
    expect(res.status).toBe(400);
  });

  it("limita a 10 pedidos por IP a cada 15 minutos", async () => {
    const app = createApp();
    const payload = { ...base, items: [{ productId: "costela", qty: 1 }] };
    for (let i = 0; i < 10; i++) {
      expect((await request(app).post("/api/orders").send(payload)).status).toBe(201);
    }
    const blocked = await request(app).post("/api/orders").send(payload);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/Muitos pedidos/);
  });
});
