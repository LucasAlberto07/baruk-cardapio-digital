import { CategoryRepository } from "../categories/categories.repository";
import { ProductRepository } from "../products/products.repository";
import { ExtraRepository } from "../extras/extras.repository";
import { PromoRepository } from "../promos/promos.repository";

/** Monta tudo o que o cardápio do cliente precisa em uma única leitura. */
export class MenuService {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly products: ProductRepository,
    private readonly extras: ExtraRepository,
    private readonly promos: PromoRepository,
  ) {}

  async getMenu() {
    const [categories, products, extras, promos] = await Promise.all([
      this.categories.list(),
      this.products.listActive(),
      this.extras.list(),
      this.promos.list(),
    ]);
    return { categories, products, extras, promos };
  }
}
