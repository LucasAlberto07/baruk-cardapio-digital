import express from "express";
import { AppConfig } from "./config/env";
import { Services } from "./container";
import { asyncHandler } from "./http/async-handler";
import { createAdminAuth } from "./http/admin-auth";
import { createCors } from "./http/cors";
import { errorHandler } from "./http/error-handler";
import { createAdminSessionLimiter } from "./http/rate-limit";
import { createMenuRouter } from "./modules/menu/menu.routes";
import { createCategoriesRouter } from "./modules/categories/categories.routes";
import { createProductsRouter } from "./modules/products/products.routes";
import { createExtrasRouter } from "./modules/extras/extras.routes";
import { createPromosRouter } from "./modules/promos/promos.routes";
import { createOrdersRouter } from "./modules/orders/orders.routes";

export type AppDependencies = {
  config: AppConfig;
  services: Services;
  checkDatabase: () => Promise<void>;
};

/** Monta o app Express com as dependências recebidas — nada é criado aqui dentro. */
export function createApp({ config, services, checkDatabase }: AppDependencies) {
  const app = express();
  const auth = createAdminAuth(config.adminApiKey);

  // Atrás de proxy (Railway, Render...) use TRUST_PROXY=1 para o rate limit enxergar o IP real do cliente.
  app.set("trust proxy", config.trustProxy);
  app.use(createCors(config.corsOrigins));
  app.use(express.json({ limit: "64kb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/ready", asyncHandler(async (_req, res) => {
    await checkDatabase();
    res.json({ ok: true, database: "available" });
  }));
  app.post("/api/admin/session", createAdminSessionLimiter(), auth.verifySession);

  app.use("/api/menu", createMenuRouter(services.menu));
  app.use("/api/categories", createCategoriesRouter(services.categories, auth));
  app.use("/api/products", createProductsRouter(services.products, auth));
  app.use("/api/extras", createExtrasRouter(services.extras, auth));
  app.use("/api/promos", createPromosRouter(services.promos, auth));
  app.use("/api/orders", createOrdersRouter(services.orders, auth));
  app.use(errorHandler);

  return app;
}
