import { PoolAllocator } from "../domain/pool-allocator.js";
import type { PoolMember } from "../domain/domain.types.js";
import { ApplicationError } from "./errors.js";
import type { PoolRepositoryPort } from "../ports/outbound/pool-repository.port.js";

export interface CreatePoolInput {
  reportingYear: number;
  members: PoolMember[];
}

export interface CreatePoolResult {
  poolId: string;
  feasible: true;
  finalBalancesByShipId: Record<string, number>;
}

export class CreatePoolUseCase {
  constructor(
    private readonly pools: PoolRepositoryPort,
    private readonly allocator: PoolAllocator,
  ) {}

  async execute(input: CreatePoolInput): Promise<CreatePoolResult> {
    if (input.members.length === 0) {
      throw new ApplicationError("Pool must have at least one member", 400);
    }

    const allocation = this.allocator.allocate(input.members);
    if (!allocation.feasible) {
      throw new ApplicationError(
        allocation.reason ?? "Pool allocation infeasible",
        400,
      );
    }

    const saved = await this.pools.savePoolWithMembers({
      reportingYear: input.reportingYear,
      finalBalancesByShipId: allocation.finalBalancesByShipId,
    });

    return {
      poolId: saved.poolId,
      feasible: true,
      finalBalancesByShipId: Object.fromEntries(
        allocation.finalBalancesByShipId,
      ),
    };
  }
}
