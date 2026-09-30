import { Router } from "express";
import { asyncHandler } from "../../http/async-handler";
import { AdminAuth } from "../../http/admin-auth";
import { createOrderLimiter } from "../../http/rate-limit";
import { OrdersService } from "./orders.service";
import { parseCreateOrder, parseListOrdersQuery, parseStatusChange } from "./orders.schemas";

export function createOrdersRouter(service: OrdersService, auth: AdminAuth) {
  const router = Router();

  // Público: o cliente registra o pedido pelo cardápio.
  router.post("/", createOrderLimiter(), asyncHandler(async (req, res) => {
    res.status(201).json(await service.create(parseCreateOrder(req.body)));
  }));

  // Painel: fila, histórico, detalhes e status.
  router.get("/", auth.requireAdmin, asyncHandler(async (req, res) => {
    res.json(await service.list(parseListOrdersQuery(req.query)));
  }));

  router.get("/:id", auth.requireAdmin, asyncHandler(async (req, res) => {
    res.json(await service.get(req.params.id));
  }));

  router.patch("/:id/status", auth.requireAdmin, asyncHandler(async (req, res) => {
    res.json(await service.changeStatus(req.params.id, parseStatusChange(req.body)));
  }));

  return router;
}
