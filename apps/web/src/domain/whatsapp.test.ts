import { describe, expect, it } from "vitest";
import { buildOrderMessage, validateCustomer } from "./whatsapp";

const customer = { name: "Ana", phone: "11 91234-5678", address: "Rua A, 1", notes: "" };

describe("validateCustomer", () => {
  it("exige nome e endereço", () => {
    expect(validateCustomer(customer)).toBeNull();
    expect(validateCustomer({ ...customer, address: "  " })).toBe("Informe seu nome e o endereço de entrega.");
  });

  it("exige telefone com DDD para os avisos do pedido", () => {
    expect(validateCustomer({ ...customer, phone: "91234-5678" })).toBe("Informe um telefone válido com DDD, ex.: (11) 91234-5678.");
  });
});

describe("buildOrderMessage", () => {
  it("lista os itens com o total da linha e os dados de entrega", () => {
    const message = buildOrderMessage({
      lines: [{ label: "Pizza Costela", qty: 3, unitPrice: 79.99 }],
      total: 239.97,
      promo: null,
      customer: { ...customer, notes: "sem cebola" },
    });
    expect(message).toContain("• 3x Pizza Costela — R$ 239,97");
    expect(message).toContain("*Total:* R$ 239,97");
    expect(message).toContain("*Nome:* Ana\n*Telefone:* (11) 91234-5678\n*Endereço:* Rua A, 1\n*Obs:* sem cebola");
  });

  it("identifica o pedido pelo número registrado no painel", () => {
    expect(buildOrderMessage({ orderNumber: 42, lines: [], total: 0, promo: null, customer })).toMatch(/^\*Novo pedido #0042 — Baruk/);
    expect(buildOrderMessage({ lines: [], total: 0, promo: null, customer })).toMatch(/^\*Novo pedido — Baruk/);
  });

  it("inclui a promoção aplicada", () => {
    const promo = { id: "p", weekday: 0, label: "Domingo", title: "Família", description: "Refri grátis" };
    expect(buildOrderMessage({ lines: [], total: 0, promo, customer })).toContain("*Promoção:* Domingo — Família (Refri grátis)");
  });
});
