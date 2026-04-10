import type { Route } from "../domain/domain.types.js";
import type { RouteRepositoryPort } from "../ports/outbound/route-repository.port.js";

export class GetRoutesUseCase {
  constructor(private readonly routes: RouteRepositoryPort) {}

  execute(): Promise<Route[]> {
    return this.routes.findAll();
  }
}
