import { Category, Extra, OrderStatus } from "@baruk/shared";
import { NotFoundError } from "../core/errors";
import { Repositories } from "../container";
import { CategoryChanges, CategoryRepository, NewCategory } from "../modules/categories/categories.repository";
import { NewProduct, ProductChanges, ProductRecord, ProductRepository } from "../modules/products/products.repository";
import { ExtraChanges, ExtraRepository, NewExtra } from "../modules/extras/extras.repository";
import { NewPromo, PromoChanges, PromoRecord, PromoRepository } from "../modules/promos/promos.repository";
import { NewOrder, Order, OrderQuery, OrderRepository } from "../modules/orders/orders.repository";

/**
 * Implementações em memória das interfaces de repositório. Os testes exercitam
 * services e rotas reais sem banco — é o que a inversão de dependência permite.
 */
class InMemoryTable<T extends { id: string }> {
  private nextId = 1;
  readonly rows: T[] = [];

  constructor(private readonly prefix: string) {}

  insert(data: Omit<T, "id"> & { id?: string }): T {
    const row = { ...data, id: data.id ?? `${this.prefix}-${this.nextId++}` } as T;
    this.rows.push(row);
    return row;
  }

  get(id: string): T {
    const row = this.rows.find((candidate) => candidate.id === id);
    if (!row) throw new NotFoundError("Registro não encontrado.");
    return row;
  }

  update(id: string, changes: Partial<T>): T {
    return Object.assign(this.get(id), changes);
  }

  remove(id: string) {
    this.rows.splice(this.rows.indexOf(this.get(id)), 1);
  }

  byIds(ids: string[]) {
    return this.rows.filter((row) => ids.includes(row.id));
  }
}

class InMemoryCategoryRepository implements CategoryRepository {
  constructor(readonly table: InMemoryTable<Category>, private readonly products: InMemoryTable<ProductRecord>) {}

  async list() {
    return [...this.table.rows].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async listWithProductCount() {
    const categories = await this.list();
    return categories.map((category) => ({
      ...category,
      _count: { products: this.products.rows.filter((product) => product.categoryId === category.id).length },
    }));
  }

  async create(data: NewCategory) {
    return this.table.insert(data);
  }

  async findOrCreateBySlug(data: NewCategory) {
    return this.table.rows.find((category) => category.slug === data.slug) ?? this.table.insert(data);
  }

  async update(id: string, changes: CategoryChanges) {
    return this.table.update(id, changes);
  }

  async delete(id: string) {
    this.table.remove(id);
  }
}

class InMemoryProductRepository implements ProductRepository {
  constructor(readonly table: InMemoryTable<ProductRecord>, private readonly categories: InMemoryTable<Category>) {}

  async listActive() {
    return this.table.rows.filter((product) => product.active);
  }

  async listWithCategory() {
    return this.table.rows.map((product) => this.withCategory(product));
  }

  async findActiveByIds(ids: string[]) {
    return this.table.byIds(ids).filter((product) => product.active).map((product) => this.withCategory(product));
  }

  async countByCategory(categoryId: string) {
    return this.table.rows.filter((product) => product.categoryId === categoryId).length;
  }

  async create(data: NewProduct) {
    this.categories.get(data.categoryId);
    return this.table.insert({ ...data, active: true, createdAt: new Date(), updatedAt: new Date() });
  }

  async update(id: string, changes: ProductChanges) {
    return this.table.update(id, { ...changes, updatedAt: new Date() });
  }

  async delete(id: string) {
    this.table.remove(id);
  }

  private withCategory(product: ProductRecord) {
    return { ...product, category: this.categories.get(product.categoryId) };
  }
}

class InMemoryExtraRepository implements ExtraRepository {
  constructor(readonly table: InMemoryTable<Extra>) {}

  async list() {
    return [...this.table.rows].sort((a, b) => a.price - b.price);
  }

  async findByIds(ids: string[]) {
    return this.table.byIds(ids);
  }

  async create(data: NewExtra) {
    return this.table.insert(data);
  }

  async update(id: string, changes: ExtraChanges) {
    return this.table.update(id, changes);
  }

  async delete(id: string) {
    this.table.remove(id);
  }
}

class InMemoryPromoRepository implements PromoRepository {
  constructor(readonly table: InMemoryTable<PromoRecord>) {}

  async list() {
    return [...this.table.rows].sort((a, b) => a.weekday - b.weekday);
  }

  async findByIds(ids: string[]) {
    return this.table.byIds(ids);
  }

  async create(data: NewPromo) {
    return this.table.insert(data);
  }

  async update(id: string, changes: PromoChanges) {
    return this.table.update(id, changes);
  }

  async delete(id: string) {
    this.table.remove(id);
  }
}

class InMemoryOrderRepository implements OrderRepository {
  readonly table = new InMemoryTable<Order>("order");

  async create({ items, ...order }: NewOrder) {
    const number = this.table.rows.length + 1;
    const id = `order-${number}`;
    // Cada pedido nasce 1 min depois do anterior, para a ordenação ser determinística.
    const createdAt = new Date(Date.UTC(2026, 8, 29, 12, number));
    return this.table.insert({
      ...order,
      id,
      number,
      status: "RECEIVED",
      createdAt,
      updatedAt: createdAt,
      completedAt: null,
      items: items.map((item, index) => ({ ...item, id: `${id}-item-${index + 1}`, orderId: id })),
    });
  }

  async findPage({ statuses, search, sort, page, pageSize }: OrderQuery) {
    const matches = this.table.rows.filter((order) =>
      statuses.includes(order.status) &&
      (!search || ("number" in search
        ? order.number === search.number
        : order.customerName.toLowerCase().includes(search.customerName.toLowerCase()))));
    const time = (date: Date | null) => date?.getTime() ?? 0;
    const sorted = sort === "oldestFirst"
      ? matches.sort((a, b) => time(a.createdAt) - time(b.createdAt))
      : matches.sort((a, b) => time(b.completedAt) - time(a.completedAt));
    return { items: sorted.slice((page - 1) * pageSize, page * pageSize), total: matches.length };
  }

  async findById(id: string) {
    return this.table.rows.find((order) => order.id === id) ?? null;
  }

  async findLatestNumber() {
    return this.table.rows.length ? Math.max(...this.table.rows.map((order) => order.number)) : null;
  }

  async updateStatus(id: string, status: OrderStatus, completedAt: Date | null) {
    return this.table.update(id, { status, completedAt, updatedAt: new Date() });
  }
}

export function createInMemoryRepositories() {
  const categoryTable = new InMemoryTable<Category>("cat");
  const productTable = new InMemoryTable<ProductRecord>("prod");

  const repositories = {
    categories: new InMemoryCategoryRepository(categoryTable, productTable),
    products: new InMemoryProductRepository(productTable, categoryTable),
    extras: new InMemoryExtraRepository(new InMemoryTable<Extra>("extra")),
    promos: new InMemoryPromoRepository(new InMemoryTable<PromoRecord>("promo")),
    orders: new InMemoryOrderRepository(),
  } satisfies Repositories;

  return repositories;
}

export type InMemoryRepositories = ReturnType<typeof createInMemoryRepositories>;
