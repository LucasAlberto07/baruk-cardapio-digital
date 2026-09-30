import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createHttpClient, errorMessage } from "./http";
import { isValidPrice } from "./pricing";

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => (body === undefined ? Promise.reject(new Error("sem corpo")) : Promise.resolve(body)),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("createHttpClient", () => {
  const client = createHttpClient({ baseUrl: "http://api", headers: () => ({ "x-admin-key": "k" }) });

  it("envia JSON com os headers configurados", async () => {
    const fetchMock = mockFetch(201, { id: "1" });
    await expect(client.post("/items", { name: "x" })).resolves.toEqual({ id: "1" });
    expect(fetchMock).toHaveBeenCalledWith("http://api/items", {
      method: "POST",
      headers: { "x-admin-key": "k", "Content-Type": "application/json" },
      body: '{"name":"x"}',
    });
  });

  it("trata 204 como resposta vazia", async () => {
    mockFetch(204);
    await expect(client.delete("/items/1")).resolves.toBeUndefined();
  });

  it("lança ApiError com a mensagem e o status da API", async () => {
    mockFetch(400, { error: "Pedido inválido." });
    await expect(client.get("/items")).rejects.toEqual(new ApiError("Pedido inválido.", 400));
  });

  it("deixa falhas de rede passarem sem virar ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(client.get("/items")).rejects.toBeInstanceOf(TypeError);
  });
});

describe("errorMessage", () => {
  it("usa a mensagem do erro ou o texto padrão", () => {
    expect(errorMessage(new Error("falhou"), "padrão")).toBe("falhou");
    expect(errorMessage("x", "padrão")).toBe("padrão");
  });
});

describe("isValidPrice", () => {
  it("aplica a faixa e as duas casas decimais", () => {
    expect([0.01, 50, 9999.99].every(isValidPrice)).toBe(true);
    expect([0, 10000, 1.001, Number.NaN, "10"].some(isValidPrice)).toBe(false);
  });
});
