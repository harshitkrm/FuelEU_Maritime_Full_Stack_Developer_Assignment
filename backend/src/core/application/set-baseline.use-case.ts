import { ApplicationError } from "./errors.js";
import type { RouteRepositoryPort } from "../ports/outbound/route-repository.port.js";

export class SetBaselineUseCase {
  constructor(private readonly routes: RouteRepositoryPort) {}

  async execute(routeId: string): Promise<void> {
    const existing = await this.routes.findById(routeId);
    if (!existing) {
      throw new ApplicationError("Route not found", 404);
    }
    await this.routes.setBaseline(routeId);
  }
}
