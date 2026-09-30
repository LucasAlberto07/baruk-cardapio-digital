import { Router } from "express";
import { asyncHandler } from "../../http/async-handler";
import { AdminAuth } from "../../http/admin-auth";
import { ProductsService } from "./products.service";
import { parseCreateProduct, parseUpdateProduct } from "./products.schemas";

export function createProductsRouter(service: ProductsService, auth: AdminAuth) {
  const router = Router();
  router.use(auth.requireAdmin);

  router.get("/", asyncHandler(async (_req, res) => {
    res.json(await service.list());
  }));

  router.post("/", asyncHandler(async (req, res) => {
    res.status(201).json(await service.create(parseCreateProduct(req.body)));
  }));

  router.put("/:id", asyncHandler(async (req, res) => {
    res.json(await service.update(req.params.id, parseUpdateProduct(req.body)));
  }));

  router.delete("/:id", asyncHandler(async (req, res) => {
    await service.delete(req.params.id);
    res.status(204).end();
  }));

  return router;
}
