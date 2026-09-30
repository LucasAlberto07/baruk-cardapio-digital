import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/admin-auth";
import { asyncHandler } from "../lib/async-handler";
import { isRecord, validPrice, validText } from "../lib/validation";

export const extrasRouter = Router();

extrasRouter.get("/", asyncHandler(async (_req, res) => {
  const extras = await prisma.extra.findMany({ orderBy: { price: "asc" } });
  res.json(extras.map((extra) => ({ ...extra, price: Number(extra.price) })));
}));

extrasRouter.post("/", requireAdmin, asyncHandler(async (req, res) => {
  if (!isRecord(req.body)) return res.status(400).json({ error: "Corpo da requisição inválido." });
  const { name, price } = req.body;
  if (!validText(name, 80) || !validPrice(price)) return res.status(400).json({ error: "Informe nome válido e preço entre R$ 0,01 e R$ 9.999,99." });
  const extra = await prisma.extra.create({ data: { name: name.trim(), price } });
  res.status(201).json({ ...extra, price: Number(extra.price) });
}));

extrasRouter.put("/:id", requireAdmin, asyncHandler(async (req, res) => {
  if (!isRecord(req.body) || Object.keys(req.body).length === 0) return res.status(400).json({ error: "Informe campos para atualizar." });
  const data: { name?: string; price?: number } = {};
  if ("name" in req.body) {
    if (!validText(req.body.name, 80)) return res.status(400).json({ error: "Nome inválido." });
    data.name = req.body.name.trim();
  }
  if ("price" in req.body) {
    if (!validPrice(req.body.price)) return res.status(400).json({ error: "Preço deve ser entre R$ 0,01 e R$ 9.999,99, com até duas casas decimais." });
    data.price = req.body.price;
  }
  const extra = await prisma.extra.update({ where: { id: req.params.id }, data });
  res.json({ ...extra, price: Number(extra.price) });
}));

extrasRouter.delete("/:id", requireAdmin, asyncHandler(async (req, res) => {
  await prisma.extra.delete({ where: { id: req.params.id } });
  res.status(204).end();
}));
