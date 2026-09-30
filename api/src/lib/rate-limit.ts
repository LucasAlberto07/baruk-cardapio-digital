import rateLimit from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Criados por instância do app (e não no módulo) para que cada createApp()
// tenha seu próprio contador — importante nos testes.
export function createOrderLimiter() {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Muitos pedidos em pouco tempo. Aguarde alguns minutos e tente novamente." },
  });
}

export function createAdminSessionLimiter() {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Muitas tentativas de acesso. Aguarde alguns minutos." },
  });
}
