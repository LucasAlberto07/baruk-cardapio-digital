import { Prisma, PrismaClient } from "@prisma/client";
import { Category, Product } from "@baruk/shared";
import { decimalToNumber } from "../../core/money";

export type ProductRecord = Product & { createdAt: Date; updatedAt: Date };
export type ProductWithCategory = ProductRecord & { category: Category };
export type NewProduct = Pick<Product, "name" | "description" | "price" | "categoryId">;
export type ProductChanges = Partial<Pick<Product, "name" | "description" | "price" | "active">>;

export interface ProductRepository {
  listActive(): Promise<ProductRecord[]>;
  listWithCategory(): Promise<ProductWithCategory[]>;
  /** Só devolve os produtos ativos; ids inexistentes ou inativos ficam de fora. */
  findActiveByIds(ids: string[]): Promise<ProductWithCategory[]>;
  countByCategory(categoryId: string): Promise<number>;
  create(data: NewProduct): Promise<ProductRecord>;
  update(id: string, changes: ProductChanges): Promise<ProductRecord>;
  delete(id: string): Promise<void>;
}

type ProductRow = Prisma.ProductGetPayload<object>;

function toProduct<T extends ProductRow>(row: T): Omit<T, "price"> & { price: number } {
  return { ...row, price: decimalToNumber(row.price) };
}

export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listActive() {
    const rows = await this.prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } });
    return rows.map(toProduct);
  }

  async listWithCategory() {
    const rows = await this.prisma.product.findMany({ include: { category: true } });
    return rows.map(toProduct);
  }

  async findActiveByIds(ids: string[]) {
    if (ids.length === 0) return [];
    const rows = await this.prisma.product.findMany({ where: { id: { in: ids }, active: true }, include: { category: true } });
    return rows.map(toProduct);
  }

  countByCategory(categoryId: string) {
    return this.prisma.product.count({ where: { categoryId } });
  }

  async create(data: NewProduct) {
    return toProduct(await this.prisma.product.create({ data }));
  }

  async update(id: string, changes: ProductChanges) {
    return toProduct(await this.prisma.product.update({ where: { id }, data: changes }));
  }

  async delete(id: string) {
    await this.prisma.product.delete({ where: { id } });
  }
}
