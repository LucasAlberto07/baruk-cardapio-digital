import { afterEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { requireAdmin } from "./admin-auth";

const KEY = "k".repeat(32);

function run(header: string | undefined) {
  const req = { header: () => header } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response;
  const next = vi.fn();
  requireAdmin(req, res, next);
  return { res, next };
}

describe("requireAdmin", () => {
  afterEach(() => {
    delete process.env.ADMIN_API_KEY;
  });

  it("responde 503 quando a chave do servidor não está configurada", () => {
    const { res, next } = run(KEY);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 401 com chave errada", () => {
    process.env.ADMIN_API_KEY = KEY;
    const { res, next } = run("x".repeat(32));
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("libera com a chave correta", () => {
    process.env.ADMIN_API_KEY = KEY;
    const { next } = run(KEY);
    expect(next).toHaveBeenCalled();
  });
});
