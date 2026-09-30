import { Router } from "express";
import { asyncHandler } from "../../http/async-handler";
import { AdminAuth } from "../../http/admin-auth";
import { CategoriesService } from "./categories.service";
import { parseCreateCategory, parseUpdateCategory } from "./categories.schemas";

export function createCategoriesRouter(service: CategoriesService, auth: AdminAuth) {
  const router = Router();
  router.use(auth.requireAdmin);

  router.get("/", asyncHandler(async (_req, res) => {
    res.json(await service.list());
  }));

  router.post("/", asyncHandler(async (req, res) => {
    res.status(201).json(await service.create(parseCreateCategory(req.body)));
  }));

  router.put("/:id", asyncHandler(async (req, res) => {
    res.json(await service.update(req.params.id, parseUpdateCategory(req.body)));
  }));

  router.delete("/:id", asyncHandler(async (req, res) => {
    await service.delete(req.params.id);
    res.status(204).end();
  }));

  return router;
}
