import { PrismaClient } from "@prisma/client";
import { Extra } from "@baruk/shared";
import { decimalToNumber } from "../../core/money";

export type NewExtra = Omit<Extra, "id">;
export type ExtraChanges = Partial<NewExtra>;

export interface ExtraRepository {
  list(): Promise<Extra[]>;
  findByIds(ids: string[]): Promise<Extra[]>;
  create(data: NewExtra): Promise<Extra>;
  update(id: string, changes: ExtraChanges): Promise<Extra>;
  delete(id: string): Promise<void>;
}

const toExtra = <T extends { price: { toString(): string } }>(row: T) => ({ ...row, price: decimalToNumber(row.price) });

export class PrismaExtraRepository implements ExtraRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list() {
    return (await this.prisma.extra.findMany({ orderBy: { price: "asc" } })).map(toExtra);
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return (await this.prisma.extra.findMany({ where: { id: { in: ids } } })).map(toExtra);
  }

  async create(data: NewExtra) {
    return toExtra(await this.prisma.extra.create({ data }));
  }

  async update(id: string, changes: ExtraChanges) {
    return toExtra(await this.prisma.extra.update({ where: { id }, data: changes }));
  }

  async delete(id: string) {
    await this.prisma.extra.delete({ where: { id } });
  }
}
