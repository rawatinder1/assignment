// src/core/domain/PoolEntity.ts

export interface PoolMemberEntity {
  id: number;
  poolId: number;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface PoolEntity {
  id: number;
  year: number;
  createdAt: Date;
  members: PoolMemberEntity[];
}

