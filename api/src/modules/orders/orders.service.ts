import { weekdayInSaoPaulo } from "@baruk/shared";
import { ProductRepository } from "../products/products.repository";
import { ExtraRepository } from "../extras/extras.repository";
import { PromoRepository } from "../promos/promos.repository";
import { OrderRepository } from "./orders.repository";
import { OrderCatalog, priceOrder, referencedIds } from "./order-pricing";
import { CreateOrderInput, OrderItemInput } from "./orders.schemas";

const RECENT_ORDERS_LIMIT = 100;

export type Clock = () => Date;

export class OrdersService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly products: ProductRepository,
    private readonly extras: ExtraRepository,
    private readonly promos: PromoRepository,
    private readonly now: Clock = () => new Date(),
  ) {}

  /** O navegador só manda ids e quantidades: preços e rótulos saem sempre do banco. */
  async create({ items, ...customer }: CreateOrderInput) {
    const catalog = await this.loadCatalog(items);
    const { items: pricedItems, total } = priceOrder(items, catalog, weekdayInSaoPaulo(this.now()));
    return this.orders.create({ ...customer, total, items: pricedItems });
  }

  listRecent() {
    return this.orders.listRecent(RECENT_ORDERS_LIMIT);
  }

  private async loadCatalog(items: OrderItemInput[]): Promise<OrderCatalog> {
    const { productIds, extraIds, promoIds } = referencedIds(items);
    const [products, extras, promos] = await Promise.all([
      this.products.findActiveByIds(productIds),
      this.extras.findByIds(extraIds),
      this.promos.findByIds(promoIds),
    ]);
    return {
      products: new Map(products.map((product) => [product.id, product])),
      extras: new Map(extras.map((extra) => [extra.id, extra])),
      promos: new Map(promos.map((promo) => [promo.id, promo])),
    };
  }
}
