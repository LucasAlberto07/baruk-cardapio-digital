import { Router } from "express";
import { isDrinkCategory, unitPriceCents, weekdayInSaoPaulo } from "@baruk/shared";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/admin-auth";
import { asyncHandler } from "../lib/async-handler";
import { isRecord, validText } from "../lib/validation";

export const ordersRouter = Router();

type ProductItem = { kind: "product"; productId: string; qty: number; extraIds: string[]; drinkProductId: string | null; slice: string | null };
type PromoItem = { kind: "promo"; promoId: string; qty: number };

ordersRouter.post("/", asyncHandler(async (req, res) => {
  if (!isRecord(req.body)) return res.status(400).json({ error: "Corpo da requisição inválido." });
  const { customerName, address, notes, items } = req.body;

  if (!validText(customerName, 100) || !validText(address, 300) ||
      (notes !== undefined && !validText(notes, 500, true)) ||
      !Array.isArray(items) || items.length === 0 || items.length > 30) {
    return res.status(400).json({ error: "Pedido inválido: informe cliente, endereço e de 1 a 30 itens." });
  }

  const normalizedItems: (ProductItem | PromoItem)[] = [];
  for (const item of items) {
    if (!isRecord(item) || !Number.isInteger(item.qty) || (item.qty as number) < 1 || (item.qty as number) > 30) {
      return res.status(400).json({ error: "Um ou mais itens do pedido são inválidos." });
    }
    // Item de promoção: só o id e a quantidade; o preço vem do banco.
    if (item.promoId !== undefined) {
      if (!validText(item.promoId, 100) || item.productId !== undefined || item.extraIds !== undefined ||
          (item.drinkProductId !== undefined && item.drinkProductId !== null) ||
          (item.slice !== undefined && item.slice !== null)) {
        return res.status(400).json({ error: "Um ou mais itens do pedido são inválidos." });
      }
      normalizedItems.push({ kind: "promo", promoId: item.promoId, qty: item.qty as number });
      continue;
    }
    if (!validText(item.productId, 100) ||
        (item.slice !== undefined && item.slice !== null && item.slice !== "8 fatias" && item.slice !== "12 fatias") ||
        (item.drinkProductId !== undefined && item.drinkProductId !== null && !validText(item.drinkProductId, 100)) ||
        (item.extraIds !== undefined && (!Array.isArray(item.extraIds) || item.extraIds.length > 10 || !item.extraIds.every((id) => validText(id, 100)))) ||
        (Array.isArray(item.extraIds) && new Set(item.extraIds).size !== item.extraIds.length)) {
      return res.status(400).json({ error: "Um ou mais itens do pedido são inválidos." });
    }
    normalizedItems.push({
      kind: "product",
      productId: item.productId,
      qty: item.qty as number,
      extraIds: (item.extraIds as string[] | undefined) ?? [],
      drinkProductId: (item.drinkProductId as string | null | undefined) ?? null,
      slice: (item.slice as string | null | undefined) ?? null,
    });
  }

  const productItems = normalizedItems.filter((item): item is ProductItem => item.kind === "product");
  const promoItems = normalizedItems.filter((item): item is PromoItem => item.kind === "promo");
  const productIds = [...new Set(productItems.flatMap((item) => [item.productId, ...(item.drinkProductId ? [item.drinkProductId] : [])]))];
  const extraIds = [...new Set(productItems.flatMap((item) => item.extraIds))];
  const promoIds = [...new Set(promoItems.map((item) => item.promoId))];
  const [products, extras, promos] = await Promise.all([
    productIds.length ? prisma.product.findMany({ where: { id: { in: productIds }, active: true }, include: { category: true } }) : [],
    extraIds.length ? prisma.extra.findMany({ where: { id: { in: extraIds } } }) : [],
    promoIds.length ? prisma.promo.findMany({ where: { id: { in: promoIds } } }) : [],
  ]);
  const productsById = new Map(products.map((product) => [product.id, product]));
  const extrasById = new Map(extras.map((extra) => [extra.id, extra]));
  const promosById = new Map(promos.map((promo) => [promo.id, promo]));
  if (products.length !== productIds.length || extras.length !== extraIds.length || promos.length !== promoIds.length) {
    return res.status(400).json({ error: "O cardápio mudou ou contém uma opção indisponível. Atualize a página e tente novamente." });
  }
  const today = weekdayInSaoPaulo();
  if (promos.some((promo) => promo.price === null || promo.weekday !== today)) {
    return res.status(400).json({ error: "Essa promoção não está disponível hoje." });
  }
  for (const item of productItems) {
    const product = productsById.get(item.productId)!;
    const drink = item.drinkProductId ? productsById.get(item.drinkProductId)! : null;
    if ((drink && (!isDrinkCategory(drink.category) || isDrinkCategory(product.category))) ||
        (isDrinkCategory(product.category) && (item.extraIds.length > 0 || drink !== null))) {
      return res.status(400).json({ error: "Uma ou mais combinações de adicionais/bebidas são inválidas." });
    }
  }

  let totalCents = 0;
  const orderItems = normalizedItems.map((item) => {
    if (item.kind === "promo") {
      const promo = promosById.get(item.promoId)!;
      const unitCents = unitPriceCents({ base: promo.price! });
      totalCents += unitCents * item.qty;
      return { label: `${promo.title} (${promo.label})`, qty: item.qty, unitPrice: unitCents / 100 };
    }

    const product = productsById.get(item.productId)!;
    const drink = item.drinkProductId ? productsById.get(item.drinkProductId)! : null;
    const itemExtras = item.extraIds.map((id) => extrasById.get(id)!);
    const unitCents = unitPriceCents({ base: product.price, extras: itemExtras.map((extra) => extra.price), drink: drink?.price ?? null });

    totalCents += unitCents * item.qty;
    const label = [
      isDrinkCategory(product.category) ? product.name : `Pizza ${product.name}${item.slice ? ` (${item.slice})` : ""}`,
      ...itemExtras.map((extra) => extra.name),
      ...(drink ? [drink.name] : []),
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
