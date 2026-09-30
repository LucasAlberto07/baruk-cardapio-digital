import { CategoriesService } from "../categories/categories.service";
import { ProductRepository } from "./products.repository";
import { CreateProductInput, UpdateProductInput } from "./products.schemas";

export class ProductsService {
  constructor(
    private readonly products: ProductRepository,
    private readonly categories: CategoriesService,
  ) {}

  list() {
    return this.products.listWithCategory();
  }

  async create({ name, description = "", price, category }: CreateProductInput) {
    const categoryId = "id" in category ? category.id : (await this.categories.findOrCreateByName(category.name)).id;
    return this.products.create({ name, description, price, categoryId });
  }

  update(id: string, changes: UpdateProductInput) {
    return this.products.update(id, changes);
  }

  delete(id: string) {
    return this.products.delete(id);
  }
}
