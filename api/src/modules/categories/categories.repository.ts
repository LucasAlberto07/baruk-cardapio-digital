import { PrismaClient } from "@prisma/client";
import { Category } from "@baruk/shared";

export type CategoryWithProductCount = Category & { _count: { products: number } };
export type NewCategory = Omit<Category, "id">;
export type CategoryChanges = Partial<Pick<Category, "name" | "sortOrder">>;

export interface CategoryRepository {
  list(): Promise<Category[]>;
  listWithProductCount(): Promise<CategoryWithProductCount[]>;
  create(data: NewCategory): Promise<Category>;
  /** Devolve a categoria com esse slug, criando-a se ainda não existir. */
  findOrCreateBySlug(data: NewCategory): Promise<Category>;
  update(id: string, changes: CategoryChanges): Promise<Category>;
  delete(id: string): Promise<void>;
}

export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list() {
    return this.prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  }

  listWithProductCount() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
  }

  create(data: NewCategory) {
    return this.prisma.category.create({ data });
  }

  findOrCreateBySlug(data: NewCategory) {
    return this.prisma.category.upsert({ where: { slug: data.slug }, update: {}, create: data });
  }

  update(id: string, changes: CategoryChanges) {
    return this.prisma.category.update({ where: { id }, data: changes });
  }

  async delete(id: string) {
    await this.prisma.category.delete({ where: { id } });
  }
}
