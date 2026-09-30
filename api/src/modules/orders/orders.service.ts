import { canChangeOrderStatus, formatOrderNumber, OPEN_ORDER_STATUSES, ORDER_STATUS_LABELS, OrderStatus, weekdayInSaoPaulo } from "@baruk/shared";
import { ConflictError, NotFoundError } from "../../core/errors";
import { ProductRepository } from "../products/products.repository";
import { ExtraRepository } from "../extras/extras.repository";
import { PromoRepository } from "../promos/promos.repository";
import { Order, OrderQuery, OrderRepository } from "./orders.repository";
import { OrderCatalog, priceOrder, referencedIds } from "./order-pricing";
import { CreateOrderInput, ListOrdersInput, OrderItemInput } from "./orders.schemas";

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

  /** Fila de pedidos em aberto (mais antigos primeiro) ou histórico de concluídos. */
  async list({ view, search, page, pageSize }: ListOrdersInput) {
    const query: OrderQuery = view === "open"
      ? { statuses: OPEN_ORDER_STATUSES, sort: "oldestFirst", search, page, pageSize }
      : { statuses: ["COMPLETED"], sort: "recentlyCompleted", search, page, pageSize };
    const [{ items, total }, latestOrderNumber] = await Promise.all([
      this.orders.findPage(query),
      this.orders.findLatestNumber(),
    ]);
    return { items, total, page, pageSize, latestOrderNumber };
  }

  async get(id: string): Promise<Order> {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundError("Pedido não encontrado.");
    return order;
  }

  /** Avança o status do pedido; concluir registra a data e o move para o histórico. */
  async changeStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.get(id);
    if (!canChangeOrderStatus(order.status, status)) {
      throw new ConflictError(
        `O pedido ${formatOrderNumber(order.number)} está "${ORDER_STATUS_LABELS[order.status]}" e não pode passar para "${ORDER_STATUS_LABELS[status]}".`,
      );
    }
    return this.orders.updateStatus(id, status, status === "COMPLETED" ? this.now() : null);
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
