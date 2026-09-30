import { Prisma, PrismaClient } from "@prisma/client";
import { decimalToNumber } from "../../core/money";
import { PricedOrderItem } from "./order-pricing";

export type OrderItem = PricedOrderItem & { id: string; orderId: string };
export type Order = {
  id: string;
  customerName: string;
  address: string;
  notes: string | null;
  total: number;
  createdAt: Date;
  items: OrderItem[];
};
export type NewOrder = Omit<Order, "id" | "createdAt" | "items"> & { items: PricedOrderItem[] };

export interface OrderRepository {
  create(order: NewOrder): Promise<Order>;
  listRecent(limit: number): Promise<Order[]>;
}

type OrderRow = Prisma.OrderGetPayload<{ include: { items: true } }>;

function toOrder(row: OrderRow): Order {
  return {
    ...row,
    total: decimalToNumber(row.total),
    items: row.items.map((item) => ({ ...item, unitPrice: decimalToNumber(item.unitPrice) })),
  };
}

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create({ items, ...order }: NewOrder) {
    const row = await this.prisma.order.create({
      data: { ...order, items: { create: items } },
      include: { items: true },
    });
    return toOrder(row);
  }

  async listRecent(limit: number) {
    const rows = await this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toOrder);
  }
}
