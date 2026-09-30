import { Router } from "express";
import { asyncHandler } from "../../http/async-handler";
import { AdminAuth } from "../../http/admin-auth";
import { PromosService } from "./promos.service";
import { parseCreatePromo, parseUpdatePromo } from "./promos.schemas";

export function createPromosRouter(service: PromosService, auth: AdminAuth) {
  const router = Router();

  router.get("/", asyncHandler(async (_req, res) => {
    res.json(await service.list());
  }));

  router.post("/", auth.requireAdmin, asyncHandler(async (req, res) => {
    res.status(201).json(await service.create(parseCreatePromo(req.body)));
  }));

  router.put("/:id", auth.requireAdmin, asyncHandler(async (req, res) => {
    res.json(await service.update(req.params.id, parseUpdatePromo(req.body)));
  }));

  router.delete("/:id", auth.requireAdmin, asyncHandler(async (req, res) => {
    await service.delete(req.params.id);
    res.status(204).end();
  }));

  return router;
}
