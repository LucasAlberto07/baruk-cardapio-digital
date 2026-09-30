import express from "express";
import cors from "cors";
import { menuRouter } from "./routes/menu.routes";
import { productsRouter } from "./routes/products.routes";
import { extrasRouter } from "./routes/extras.routes";
import { ordersRouter } from "./routes/orders.routes";
import { categoriesRouter } from "./routes/categories.routes";
import { promosRouter } from "./routes/promos.routes";
import { verifyAdminSession } from "./lib/admin-auth";
import { asyncHandler } from "./lib/async-handler";
import { errorHandler } from "./lib/errors";
import { prisma } from "./lib/prisma";
import { createAdminSessionLimiter, createOrderLimiter } from "./lib/rate-limit";

export function createApp() {
  const app = express();
  // Atrás de proxy (Railway, Render...) use TRUST_PROXY=1 para o rate limit enxergar o IP real do cliente.
  app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 0));

  const configuredOrigins = (process.env.CORS_ORIGINS ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);
  const allowedOrigins = configuredOrigins.length > 0
    ? configuredOrigins
    : process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:5173", "http://localhost:5174"];

  if (process.env.NODE_ENV === "production" && configuredOrigins.length === 0) {
    console.warn("[config] CORS_ORIGINS vazio em produção: nenhum navegador conseguirá chamar a API. Configure os domínios do web e do admin.");
  }
  if (!process.env.ADMIN_API_KEY || process.env.ADMIN_API_KEY.length < 32) {
    console.warn("[config] ADMIN_API_KEY ausente ou com menos de 32 caracteres: as rotas administrativas responderão 503.");
  }

  app.use(cors({ origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origem não permitida pelo CORS."));
  } }));
  app.use(express.json({ limit: "64kb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/ready", asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: "available" });
  }));
  app.post("/api/admin/session", createAdminSessionLimiter(), verifyAdminSession);

  app.use("/api/menu", menuRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/extras", extrasRouter);
  app.use("/api/promos", promosRouter);
  app.post("/api/orders", createOrderLimiter());
  app.use("/api/orders", ordersRouter);
  app.use(errorHandler);

  return app;
}
