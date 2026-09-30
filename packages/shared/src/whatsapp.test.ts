import { describe, expect, it } from "vitest";
import { customerStatusMessage, CUSTOMER_NOTIFIED_STATUSES, formatPhone, normalizeBrazilianPhone, whatsappLink } from "./whatsapp";

describe("normalizeBrazilianPhone", () => {
  it("aceita celular e fixo em qualquer formato e devolve só dígitos com DDI", () => {
    expect(normalizeBrazilianPhone("(11) 91234-5678")).toBe("5511912345678");
    expect(normalizeBrazilianPhone("+55 11 91234 5678")).toBe("5511912345678");
    expect(normalizeBrazilianPhone("11 3456-7890")).toBe("551134567890");
  });

  it("rejeita números sem DDD, curtos, longos ou com DDD inválido", () => {
    for (const input of ["91234-5678", "1191234567", "119123456789", "(01) 91234-5678", "(11) 81234-5678", ""]) {
      expect(normalizeBrazilianPhone(input)).toBeNull();
    }
  });
});

describe("formatPhone", () => {
  it("formata para exibição", () => {
    expect(formatPhone("5511912345678")).toBe("(11) 91234-5678");
    expect(formatPhone("551134567890")).toBe("(11) 3456-7890");
  });
});

describe("mensagens ao cliente", () => {
  const order = { number: 42, customerName: "Ana Souza", total: 100.22, address: "Rua A, 1" };

  it("avisa nas etapas Confirmado, Em preparo e Saiu para entrega", () => {
    expect(CUSTOMER_NOTIFIED_STATUSES).toEqual(["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"]);
    expect(customerStatusMessage(order, "CONFIRMED")).toContain("Olá, Ana! Seu pedido #0042 foi *confirmado*");
    expect(customerStatusMessage(order, "PREPARING")).toContain("#0042 está *em preparo*");
    expect(customerStatusMessage(order, "OUT_FOR_DELIVERY")).toContain("Endereço: Rua A, 1");
  });

  it("não avisa nas demais etapas", () => {
    expect(customerStatusMessage(order, "RECEIVED")).toBeNull();
    expect(customerStatusMessage(order, "COMPLETED")).toBeNull();
  });

  it("monta o link do WhatsApp com a mensagem codificada", () => {
    expect(whatsappLink("5511912345678", "Oi & tchau")).toBe("https://wa.me/5511912345678?text=Oi%20%26%20tchau");
  });
});
