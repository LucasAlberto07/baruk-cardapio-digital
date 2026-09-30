import { describe, expect, it } from "vitest";
import { buildOrderMessage, validateCustomer, whatsappUrl } from "./whatsapp";

const customer = { name: "Ana", address: "Rua A, 1", notes: "" };

describe("validateCustomer", () => {
  it("exige nome e endereço", () => {
    expect(validateCustomer(customer)).toBeNull();
    expect(validateCustomer({ ...customer, address: "  " })).toBe("Informe seu nome e o endereço de entrega.");
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
    expect(message).toContain("*Nome:* Ana\n*Endereço:* Rua A, 1\n*Obs:* sem cebola");
  });

  it("inclui a promoção aplicada", () => {
    const promo = { id: "p", weekday: 0, label: "Domingo", title: "Família", description: "Refri grátis" };
    expect(buildOrderMessage({ lines: [], total: 0, promo, customer })).toContain("*Promoção:* Domingo — Família (Refri grátis)");
  });
});

describe("whatsappUrl", () => {
  it("codifica a mensagem na URL", () => {
    expect(whatsappUrl("5511999999999", "Oi & tchau")).toBe("https://wa.me/5511999999999?text=Oi%20%26%20tchau");
  });
});
