import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/async-handler";

export const menuRouter = Router();

/**
 * Tudo o que o cardápio do cliente precisa para renderizar a página inteira,
 * em uma única chamada: categorias, produtos ativos, adicionais e promoções.
 */
menuRouter.get("/", asyncHandler(async (_req, res) => {
  const [categories, products, extras, promos] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.extra.findMany({ orderBy: { price: "asc" } }),
    prisma.promo.findMany({ orderBy: { weekday: "asc" } }),
  ]);

  res.json({
    categories,
    products: products.map((product) => ({ ...product, price: Number(product.price) })),
    extras: extras.map((extra) => ({ ...extra, price: Number(extra.price) })),
    promos: promos.map((promo) => ({ ...promo, price: promo.price === null ? null : Number(promo.price) })),
  });
}));
