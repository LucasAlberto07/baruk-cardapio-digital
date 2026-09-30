import { ConflictError, ValidationError } from "../../core/errors";
import { slugify } from "../../core/validation";
import { ProductRepository } from "../products/products.repository";
import { CategoryRepository } from "./categories.repository";
import { CreateCategoryInput, UpdateCategoryInput } from "./categories.schemas";

/** Categorias criadas sem ordem explícita vão para o fim do cardápio. */
export const DEFAULT_SORT_ORDER = 999;

export class CategoriesService {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly products: ProductRepository,
  ) {}

  list() {
    return this.categories.listWithProductCount();
  }

  create({ name, sortOrder = DEFAULT_SORT_ORDER }: CreateCategoryInput) {
    return this.categories.create({ name, slug: this.slugFor(name), sortOrder });
  }

  /** Usada ao cadastrar um produto informando a categoria pelo nome. */
  findOrCreateByName(name: string) {
    return this.categories.findOrCreateBySlug({ name, slug: this.slugFor(name), sortOrder: DEFAULT_SORT_ORDER });
  }

  update(id: string, changes: UpdateCategoryInput) {
    return this.categories.update(id, changes);
  }

  async delete(id: string) {
    if (await this.products.countByCategory(id) > 0) {
      throw new ConflictError("Remova ou mova os produtos desta categoria antes de excluí-la.");
    }
    await this.categories.delete(id);
  }

  private slugFor(name: string): string {
    const slug = slugify(name);
    if (!slug) throw new ValidationError("Nome de categoria inválido.");
    return slug;
  }
}
