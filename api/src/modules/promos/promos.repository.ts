import { PrismaClient } from "@prisma/client";
import { Promo } from "@baruk/shared";
import { nullableDecimalToNumber } from "../../core/money";

/** No banco, preço e observação são sempre presentes (null quando não há). */
export type PromoRecord = Required<Promo>;
export type NewPromo = Omit<PromoRecord, "id">;
export type PromoChanges = Partial<NewPromo>;

export interface PromoRepository {
  list(): Promise<PromoRecord[]>;
  findByIds(ids: string[]): Promise<PromoRecord[]>;
  create(data: NewPromo): Promise<PromoRecord>;
  update(id: string, changes: PromoChanges): Promise<PromoRecord>;
  delete(id: string): Promise<void>;
}

const toPromo = <T extends { price: { toString(): string } | null }>(row: T) => ({ ...row, price: nullableDecimalToNumber(row.price) });

export class PrismaPromoRepository implements PromoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list() {
    return (await this.prisma.promo.findMany({ orderBy: { weekday: "asc" } })).map(toPromo);
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return (await this.prisma.promo.findMany({ where: { id: { in: ids } } })).map(toPromo);
  }

  async create(data: NewPromo) {
    return toPromo(await this.prisma.promo.create({ data }));
  }

  async update(id: string, changes: PromoChanges) {
    return toPromo(await this.prisma.promo.update({ where: { id }, data: changes }));
  }

  async delete(id: string) {
    await this.prisma.promo.delete({ where: { id } });
  }
}
