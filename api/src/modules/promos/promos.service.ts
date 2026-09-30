import { PromoRepository } from "./promos.repository";
import { CreatePromoInput, UpdatePromoInput } from "./promos.schemas";

export class PromosService {
  constructor(private readonly promos: PromoRepository) {}

  list() {
    return this.promos.list();
  }

  create(input: CreatePromoInput) {
    return this.promos.create(input);
  }

  update(id: string, changes: UpdatePromoInput) {
    return this.promos.update(id, changes);
  }

  delete(id: string) {
    return this.promos.delete(id);
  }
}
