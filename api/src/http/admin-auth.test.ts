import { describe, expect, it } from "vitest";
import request from "supertest";
import { createTestApp, TEST_ADMIN_KEY } from "../test-support/test-app";

describe("autenticação administrativa", () => {
  it("responde 503 quando o servidor não tem chave configurada", async () => {
    const { app } = createTestApp({ adminApiKey: null });
    expect((await request(app).get("/api/products").set("x-admin-key", TEST_ADMIN_KEY)).status).toBe(503);
    expect((await request(app).post("/api/admin/session").send({ key: TEST_ADMIN_KEY })).status).toBe(503);
  });

  it("responde 401 com chave errada ou ausente", async () => {
    const { app } = createTestApp();
    expect((await request(app).get("/api/products")).status).toBe(401);
    expect((await request(app).get("/api/products").set("x-admin-key", "x".repeat(32))).status).toBe(401);
    expect((await request(app).post("/api/admin/session").send({ key: "errada" })).status).toBe(401);
  });

  it("libera com a chave correta", async () => {
    const { app } = createTestApp();
    expect((await request(app).get("/api/products").set("x-admin-key", TEST_ADMIN_KEY)).status).toBe(200);
    expect((await request(app).post("/api/admin/session").send({ key: TEST_ADMIN_KEY })).status).toBe(204);
  });
});
