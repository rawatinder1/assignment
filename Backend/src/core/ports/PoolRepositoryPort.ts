// src/core/ports/PoolRepositoryPort.ts
import type { PoolEntity, PoolMemberEntity } from "../domain/PoolEntity.js";

export interface PoolRepositoryPort {
  createPool(year: number, members: Omit<PoolMemberEntity, "id" | "poolId">[]): Promise<PoolEntity>;
}

