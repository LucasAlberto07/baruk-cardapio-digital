import express from "express";
import cors from "cors";
import { menuRouter } from "./routes/menu.routes";
import { productsRouter } from "./routes/products.routes";
import { extrasRouter } from "./routes/extras.routes";
import { ordersRouter } from "./routes/orders.routes";
import { verifyAdminSession } from "./lib/admin-auth";
import { asyncHandler } from "./lib/async-handler";
import { errorHandler } from "./lib/errors";
import { prisma } from "./lib/prisma";

export function createApp() {
  const app = express();
  const configuredOrigins = (process.env.CORS_ORIGINS ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);
  const allowedOrigins = configuredOrigins.length > 0
    ? configuredOrigins
    : process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:5173", "http://localhost:5174"];

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
  app.post("/api/admin/session", verifyAdminSession);

  app.use("/api/menu", menuRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/extras", extrasRouter);
  app.use("/api/orders", ordersRouter);
  app.use(errorHandler);

  return app;
}
