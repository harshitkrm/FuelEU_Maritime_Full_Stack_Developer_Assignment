import type { ShipCompliance } from "../../domain/domain.types.js";

export interface ComplianceRepositoryPort {
  findByShipAndYear(
    shipId: string,
    year: number,
  ): Promise<ShipCompliance | null>;
  save(record: ShipCompliance): Promise<void>;
}
