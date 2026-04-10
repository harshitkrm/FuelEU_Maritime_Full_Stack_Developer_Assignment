import type { Route } from "../../domain/domain.types.js";

export interface RouteRepositoryPort {
  findAll(): Promise<Route[]>;
  findById(id: string): Promise<Route | null>;
  /** Exactly one route may be baseline; clears others. */
  setBaseline(routeId: string): Promise<void>;
}
