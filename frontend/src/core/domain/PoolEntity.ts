// src/core/domain/PoolEntity.ts

export interface PoolMember {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface PoolResult {
  poolId: number;
  year: number;
  members: PoolMember[];
  poolSum: number;
}

