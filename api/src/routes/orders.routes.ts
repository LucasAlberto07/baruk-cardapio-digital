import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/admin-auth";
import { asyncHandler } from "../lib/async-handler";
import { isRecord, validText } from "../lib/validation";

export const ordersRouter = Router();

ordersRouter.post("/", asyncHandler(async (req, res) => {
  if (!isRecord(req.body)) return res.status(400).json({ error: "Corpo da requisição inválido." });
  const { customerName, address, notes, items } = req.body;

  if (!validText(customerName, 100) || !validText(address, 300) ||
      (notes !== undefined && !validText(notes, 500, true)) ||
      !Array.isArray(items) || items.length === 0 || items.length > 30) {
    return res.status(400).json({ error: "Pedido inválido: informe cliente, endereço e de 1 a 30 itens." });
  }

  const normalizedItems: { productId: string; qty: number; extraIds: string[]; drinkProductId: string | null; slice: string | null }[] = [];
  for (const item of items) {
    if (!isRecord(item) || !validText(item.productId, 100) ||
        !Number.isInteger(item.qty) || (item.qty as number) < 1 || (item.qty as number) > 30 ||
        (item.slice !== undefined && item.slice !== null && item.slice !== "8 fatias" && item.slice !== "12 fatias") ||
        (item.drinkProductId !== undefined && item.drinkProductId !== null && !validText(item.drinkProductId, 100)) ||
        (item.extraIds !== undefined && (!Array.isArray(item.extraIds) || item.extraIds.length > 10 || !item.extraIds.every((id) => validText(id, 100)))) ||
        (Array.isArray(item.extraIds) && new Set(item.extraIds).size !== item.extraIds.length)) {
      return res.status(400).json({ error: "Um ou mais itens do pedido são inválidos." });
    }
    normalizedItems.push({
      productId: item.productId,
      qty: item.qty as number,
      extraIds: (item.extraIds as string[] | undefined) ?? [],
      drinkProductId: (item.drinkProductId as string | null | undefined) ?? null,
      slice: (item.slice as string | null | undefined) ?? null,
    });
  }

  const productIds = [...new Set(normalizedItems.flatMap((item) => [item.productId, ...(item.drinkProductId ? [item.drinkProductId] : [])]))];
  const extraIds = [...new Set(normalizedItems.flatMap((item) => item.extraIds))];
  const [products, extras] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds }, active: true }, include: { category: true } }),
    prisma.extra.findMany({ where: { id: { in: extraIds } } }),
  ]);
  const productsById = new Map(products.map((product) => [product.id, product]));
  const extrasById = new Map(extras.map((extra) => [extra.id, extra]));
  if (products.length !== productIds.length || extras.length !== extraIds.length) {
    return res.status(400).json({ error: "O cardápio mudou ou contém uma opção indisponível. Atualize a página e tente novamente." });
  }
  for (const item of normalizedItems) {
    const product = productsById.get(item.productId)!;
    const drink = item.drinkProductId ? productsById.get(item.drinkProductId)! : null;
    if ((drink && (drink.category.slug !== "bebidas" || product.category.slug === "bebidas")) ||
        (product.category.slug === "bebidas" && (item.extraIds.length > 0 || drink !== null))) {
      return res.status(400).json({ error: "Uma ou mais combinações de adicionais/bebidas são inválidas." });
    }
  }

  let totalCents = 0;
  const orderItems = normalizedItems.map((item) => {
    const product = productsById.get(item.productId)!;
    const cents = (value: unknown) => Math.round(Number(value) * 100);
    let unitCents = cents(product.price);
    const extraNames = item.extraIds.map((id) => {
      const extra = extrasById.get(id)!;
      unitCents += cents(extra.price);
      return extra.name;
    });

    if (item.drinkProductId) {
      const drink = productsById.get(item.drinkProductId)!;
      unitCents += cents(drink.price);
    }

    totalCents += unitCents * item.qty;
    const label = [
      product.category.slug === "bebidas" ? product.name : `Pizza ${product.name}${item.slice ? ` (${item.slice})` : ""}`,
      ...extraNames,
      ...(item.drinkProductId ? [productsById.get(item.drinkProductId)!.name] : []),
    ].join(" + ");
    return { label, qty: item.qty, unitPrice: unitCents / 100 };
  });

  if (totalCents > 9_999_999_999) {
    return res.status(400).json({ error: "O total do pedido ultrapassa o limite permitido." });
  }

  const order = await prisma.order.create({
    data: {
      customerName: customerName.trim(),
      address: address.trim(),
      notes: typeof notes === "string" ? notes.trim() || null : null,
      total: totalCents / 100,
      items: { create: orderItems },
    },
    include: { items: true },
  });

  res.status(201).json({
    ...order,
    total: Number(order.total),
    items: order.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice) })),
  });
}));

ordersRouter.get("/", requireAdmin, asyncHandler(async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(orders.map((order) => ({
    ...order,
    total: Number(order.total),
    items: order.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice) })),
  })));
}));
