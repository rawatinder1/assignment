// src/adapters/outbound/postgres/PrismaPoolRepository.ts
import { prisma } from "../../../infrastructure/db/prisma.js";
import type { PoolRepositoryPort } from "../../../core/ports/PoolRepositoryPort.js";
import type { PoolEntity } from "../../../core/domain/PoolEntity.js";

export class PrismaPoolRepository implements PoolRepositoryPort {
  async createPool(
    year: number,
    members: Array<{ shipId: string; cbBefore: number; cbAfter: number }>
  ): Promise<PoolEntity> {
    const pool = await prisma.pool.create({
      data: {
        year,
        members: {
          create: members.map((m) => ({
            shipId: m.shipId,
            cbBefore: m.cbBefore,
            cbAfter: m.cbAfter,
          })),
        },
      },
      include: {
        members: true,
      },
    });
    return pool;
  }
}

