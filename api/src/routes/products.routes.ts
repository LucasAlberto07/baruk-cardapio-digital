import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/admin-auth";
import { asyncHandler } from "../lib/async-handler";
import { isRecord, slugify, validPrice, validText } from "../lib/validation";

export const productsRouter = Router();

productsRouter.use(requireAdmin);

productsRouter.get("/", asyncHandler(async (_req, res) => {
  const products = await prisma.product.findMany({ include: { category: true } });
  res.json(products.map((product) => ({ ...product, price: Number(product.price) })));
}));

productsRouter.post("/", asyncHandler(async (req, res) => {
  if (!isRecord(req.body)) return res.status(400).json({ error: "Corpo da requisição inválido." });
  const { name, description, price, categoryId, categoryName } = req.body;

  if (!validText(name, 100) || !validPrice(price) ||
      (description !== undefined && !validText(description, 500, true)) ||
      (!validText(categoryId, 100) && !validText(categoryName, 80))) {
    return res.status(400).json({ error: "Informe nome, descrição válida, preço entre R$ 0,01 e R$ 9.999,99 e categoria." });
  }

  let finalCategoryId: string;
  if (validText(categoryId, 100)) {
    finalCategoryId = categoryId;
  } else {
    if (!validText(categoryName, 80)) return res.status(400).json({ error: "Nome de categoria inválido." });
    const cleanCategoryName = categoryName.trim();
    const slug = slugify(cleanCategoryName);
    if (!slug) return res.status(400).json({ error: "Nome de categoria inválido." });
    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name: cleanCategoryName, slug, sortOrder: 999 },
    });
    finalCategoryId = category.id;
  }

  const product = await prisma.product.create({
    data: { name: name.trim(), description: typeof description === "string" ? description.trim() : "", price, categoryId: finalCategoryId },
  });
  res.status(201).json({ ...product, price: Number(product.price) });
}));

productsRouter.put("/:id", asyncHandler(async (req, res) => {
  if (!isRecord(req.body) || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Informe ao menos um campo para atualizar." });
  }
  const data: { name?: string; description?: string; price?: number; active?: boolean } = {};
  if ("name" in req.body) {
    if (!validText(req.body.name, 100)) return res.status(400).json({ error: "Nome inválido." });
    data.name = req.body.name.trim();
  }
  if ("description" in req.body) {
    if (!validText(req.body.description, 500, true)) return res.status(400).json({ error: "Descrição inválida." });
    data.description = req.body.description.trim();
  }
  if ("price" in req.body) {
    if (!validPrice(req.body.price)) return res.status(400).json({ error: "Preço deve ser entre R$ 0,01 e R$ 9.999,99, com até duas casas decimais." });
    data.price = req.body.price;
  }
  if ("active" in req.body) {
    if (typeof req.body.active !== "boolean") return res.status(400).json({ error: "Estado ativo inválido." });
    data.active = req.body.active;
  }
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ ...product, price: Number(product.price) });
}));

productsRouter.delete("/:id", asyncHandler(async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).end();
}));
