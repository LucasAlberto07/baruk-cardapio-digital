import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/admin-auth";
import { asyncHandler } from "../lib/async-handler";
import { isRecord, slugify, validText } from "../lib/validation";

export const categoriesRouter = Router();

categoriesRouter.use(requireAdmin);

function validSortOrder(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 9999;
}

categoriesRouter.get("/", asyncHandler(async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  res.json(categories);
}));

categoriesRouter.post("/", asyncHandler(async (req, res) => {
  if (!isRecord(req.body)) return res.status(400).json({ error: "Corpo da requisição inválido." });
  const { name, sortOrder } = req.body;
  if (!validText(name, 80) || (sortOrder !== undefined && !validSortOrder(sortOrder))) {
    return res.status(400).json({ error: "Informe nome válido e ordem entre 0 e 9999." });
  }
  const slug = slugify(name.trim());
  if (!slug) return res.status(400).json({ error: "Nome de categoria inválido." });
  const category = await prisma.category.create({ data: { name: name.trim(), slug, sortOrder: sortOrder ?? 999 } });
  res.status(201).json(category);
}));

// O slug não é editável: regras como a de bebidas dependem dele.
categoriesRouter.put("/:id", asyncHandler(async (req, res) => {
  if (!isRecord(req.body) || Object.keys(req.body).length === 0) return res.status(400).json({ error: "Informe campos para atualizar." });
  if ("slug" in req.body) return res.status(400).json({ error: "O identificador (slug) da categoria não pode ser alterado." });
  const data: { name?: string; sortOrder?: number } = {};
  if ("name" in req.body) {
    if (!validText(req.body.name, 80)) return res.status(400).json({ error: "Nome inválido." });
    data.name = req.body.name.trim();
  }
  if ("sortOrder" in req.body) {
    if (!validSortOrder(req.body.sortOrder)) return res.status(400).json({ error: "Ordem deve ser um inteiro entre 0 e 9999." });
    data.sortOrder = req.body.sortOrder;
  }
  const category = await prisma.category.update({ where: { id: req.params.id }, data });
  res.json(category);
}));

categoriesRouter.delete("/:id", asyncHandler(async (req, res) => {
  const productCount = await prisma.product.count({ where: { categoryId: req.params.id } });
  if (productCount > 0) {
    return res.status(409).json({ error: "Remova ou mova os produtos desta categoria antes de excluí-la." });
  }
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).end();
}));
