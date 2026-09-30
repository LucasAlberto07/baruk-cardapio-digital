import { Router } from "express";
import { asyncHandler } from "../../http/async-handler";
import { AdminAuth } from "../../http/admin-auth";
import { createOrderLimiter } from "../../http/rate-limit";
import { OrdersService } from "./orders.service";
import { parseCreateOrder } from "./orders.schemas";

export function createOrdersRouter(service: OrdersService, auth: AdminAuth) {
  const router = Router();

  router.post("/", createOrderLimiter(), asyncHandler(async (req, res) => {
    res.status(201).json(await service.create(parseCreateOrder(req.body)));
  }));

  router.get("/", auth.requireAdmin, asyncHandler(async (_req, res) => {
    res.json(await service.listRecent());
  }));

  return router;
}
