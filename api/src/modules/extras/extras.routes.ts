import { Router } from "express";
import { asyncHandler } from "../../http/async-handler";
import { AdminAuth } from "../../http/admin-auth";
import { ExtrasService } from "./extras.service";
import { parseCreateExtra, parseUpdateExtra } from "./extras.schemas";

export function createExtrasRouter(service: ExtrasService, auth: AdminAuth) {
  const router = Router();

  router.get("/", asyncHandler(async (_req, res) => {
    res.json(await service.list());
  }));

  router.post("/", auth.requireAdmin, asyncHandler(async (req, res) => {
    res.status(201).json(await service.create(parseCreateExtra(req.body)));
  }));

  router.put("/:id", auth.requireAdmin, asyncHandler(async (req, res) => {
    res.json(await service.update(req.params.id, parseUpdateExtra(req.body)));
  }));

  router.delete("/:id", auth.requireAdmin, asyncHandler(async (req, res) => {
    await service.delete(req.params.id);
    res.status(204).end();
  }));

  return router;
}
