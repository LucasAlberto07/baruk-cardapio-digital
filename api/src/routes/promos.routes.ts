import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/admin-auth";
import { asyncHandler } from "../lib/async-handler";
import { isRecord, validPrice, validText } from "../lib/validation";

export const promosRouter = Router();

type PromoData = { weekday?: number; label?: string; title?: string; description?: string; price?: number | null; note?: string | null };

const serialize = <T extends { price: unknown }>(promo: T) => ({ ...promo, price: promo.price === null ? null : Number(promo.price) });

/** Valida os campos presentes no corpo; devolve a mensagem de erro ou os dados limpos. */
function parsePromo(body: Record<string, unknown>): string | PromoData {
  const data: PromoData = {};
  if ("weekday" in body) {
    if (!Number.isInteger(body.weekday) || (body.weekday as number) < 0 || (body.weekday as number) > 6) return "Dia da semana deve ser de 0 (domingo) a 6 (sábado).";
    data.weekday = body.weekday as number;
  }
  if ("label" in body) {
    if (!validText(body.label, 40)) return "Rótulo inválido.";
    data.label = body.label.trim();
  }
  if ("title" in body) {
    if (!validText(body.title, 100)) return "Título inválido.";
    data.title = body.title.trim();
  }
  if ("description" in body) {
    if (!validText(body.description, 500)) return "Descrição inválida.";
    data.description = body.description.trim();
  }
  if ("price" in body) {
    if (body.price !== null && !validPrice(body.price)) return "Preço deve ser nulo ou entre R$ 0,01 e R$ 9.999,99.";
    data.price = body.price as number | null;
  }
  if ("note" in body) {
    if (body.note !== null && !validText(body.note, 200, true)) return "Observação inválida.";
    data.note = typeof body.note === "string" ? body.note.trim() || null : null;
  }
  return data;
}

promosRouter.get("/", asyncHandler(async (_req, res) => {
  const promos = await prisma.promo.findMany({ orderBy: { weekday: "asc" } });
  res.json(promos.map(serialize));
}));

promosRouter.post("/", requireAdmin, asyncHandler(async (req, res) => {
  if (!isRecord(req.body)) return res.status(400).json({ error: "Corpo da requisição inválido." });
  const data = parsePromo(req.body);
  if (typeof data === "string") return res.status(400).json({ error: data });
  const { weekday, label, title, description } = data;
  if (weekday === undefined || !label || !title || !description) {
    return res.status(400).json({ error: "Informe dia da semana, rótulo, título e descrição." });
  }
  const promo = await prisma.promo.create({ data: { weekday, label, title, description, price: data.price ?? null, note: data.note ?? null } });
  res.status(201).json(serialize(promo));
}));

promosRouter.put("/:id", requireAdmin, asyncHandler(async (req, res) => {
  if (!isRecord(req.body) || Object.keys(req.body).length === 0) return res.status(400).json({ error: "Informe campos para atualizar." });
  const data = parsePromo(req.body);
  if (typeof data === "string") return res.status(400).json({ error: data });
  const promo = await prisma.promo.update({ where: { id: req.params.id }, data });
  res.json(serialize(promo));
}));

promosRouter.delete("/:id", requireAdmin, asyncHandler(async (req, res) => {
  await prisma.promo.delete({ where: { id: req.params.id } });
  res.status(204).end();
}));
