import { Router } from "express";
import { asyncHandler } from "../../http/async-handler";
import { MenuService } from "./menu.service";

export function createMenuRouter(service: MenuService) {
  const router = Router();

  router.get("/", asyncHandler(async (_req, res) => {
    res.json(await service.getMenu());
  }));

  return router;
}
