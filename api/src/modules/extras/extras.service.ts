import { ExtraRepository } from "./extras.repository";
import { CreateExtraInput, UpdateExtraInput } from "./extras.schemas";

export class ExtrasService {
  constructor(private readonly extras: ExtraRepository) {}

  list() {
    return this.extras.list();
  }

  create(input: CreateExtraInput) {
    return this.extras.create(input);
  }

  update(id: string, changes: UpdateExtraInput) {
    return this.extras.update(id, changes);
  }

  delete(id: string) {
    return this.extras.delete(id);
  }
}
