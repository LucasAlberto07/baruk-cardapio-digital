import { Prisma, PrismaClient } from "@prisma/client";
import { OrderStatus } from "@baruk/shared";
import { decimalToNumber } from "../../core/money";
import { PricedOrderItem } from "./order-pricing";

export type OrderItem = PricedOrderItem & { id: string; orderId: string };
export type Order = {
  id: string;
  number: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string | null;
  address: string;
  notes: string | null;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  items: OrderItem[];
};
export type NewOrder = Pick<Order, "customerName" | "address" | "notes" | "total"> & { customerPhone: string; items: PricedOrderItem[] };

export type OrderSearch = { number: number } | { customerName: string };
export type OrderQuery = {
  statuses: OrderStatus[];
  search: OrderSearch | null;
  /** Fila: mais antigos primeiro. Histórico: concluídos mais recentes primeiro. */
  sort: "oldestFirst" | "recentlyCompleted";
  page: number;
  pageSize: number;
};
export type OrderPage = { items: Order[]; total: number };

export interface OrderRepository {
  create(order: NewOrder): Promise<Order>;
  findPage(query: OrderQuery): Promise<OrderPage>;
  findById(id: string): Promise<Order | null>;
  findLatestNumber(): Promise<number | null>;
  updateStatus(id: string, status: OrderStatus, completedAt: Date | null): Promise<Order>;
}

type OrderRow = Prisma.OrderGetPayload<{ include: { items: true } }>;

function toOrder(row: OrderRow): Order {
  return {
    ...row,
    total: decimalToNumber(row.total),
    items: row.items.map((item) => ({ ...item, unitPrice: decimalToNumber(item.unitPrice) })),
  };
}

function toWhere({ statuses, search }: OrderQuery): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = { status: { in: statuses } };
  if (search && "number" in search) where.number = search.number;
  if (search && "customerName" in search) where.customerName = { contains: search.customerName, mode: "insensitive" };
  return where;
}

const ORDER_BY: Record<OrderQuery["sort"], Prisma.OrderOrderByWithRelationInput[]> = {
  oldestFirst: [{ createdAt: "asc" }],
  recentlyCompleted: [{ completedAt: "desc" }, { createdAt: "desc" }],
};

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create({ items, ...order }: NewOrder) {
    const row = await this.prisma.order.create({
      data: { ...order, items: { create: items } },
      include: { items: true },
    });
    return toOrder(row);
  }

  async findPage(query: OrderQuery) {
    const where = toWhere(query);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: ORDER_BY[query.sort],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items: rows.map(toOrder), total };
  }

  async findById(id: string) {
    const row = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    return row ? toOrder(row) : null;
  }

  async findLatestNumber() {
    const { _max } = await this.prisma.order.aggregate({ _max: { number: true } });
    return _max.number;
  }

  async updateStatus(id: string, status: OrderStatus, completedAt: Date | null) {
    const row = await this.prisma.order.update({
      where: { id },
      data: { status, completedAt },
      include: { items: true },
    });
    return toOrder(row);
  }
}
