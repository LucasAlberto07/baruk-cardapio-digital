import rateLimit from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

// Criados por instância do app (e não no módulo) para que cada createApp()
// tenha seu próprio contador — importante nos testes.
function createLimiter(message: string) {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: MAX_REQUESTS_PER_WINDOW,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: message },
  });
}

export const createOrderLimiter = () =>
  createLimiter("Muitos pedidos em pouco tempo. Aguarde alguns minutos e tente novamente.");

export const createAdminSessionLimiter = () =>
  createLimiter("Muitas tentativas de acesso. Aguarde alguns minutos.");
