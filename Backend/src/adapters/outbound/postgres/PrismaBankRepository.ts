// src/adapters/outbound/postgres/PrismaBankRepository.ts
import { prisma } from "../../../infrastructure/db/prisma.js";
import type { BankRepositoryPort } from "../../../core/ports/BankRepositoryPort.js";
import type { BankEntryEntity } from "../../../core/domain/BankEntryEntity.js";

export class PrismaBankRepository implements BankRepositoryPort {
  async getBankedAmount(shipId: string, year: number): Promise<number> {
    const entries = await prisma.bankEntry.findMany({
      where: { shipId, year, amountGco2eq: { gt: 0 } },
    });
    return entries.reduce((sum, entry) => sum + entry.amountGco2eq, 0);
  }

  async getBankRecords(shipId: string, year: number): Promise<BankEntryEntity[]> {
    return prisma.bankEntry.findMany({
      where: { shipId, year },
    });
  }

  async bankSurplus(shipId: string, year: number, amount: number): Promise<BankEntryEntity> {
    if (amount <= 0) {
      throw new Error("Amount must be positive to bank surplus");
    }
    return prisma.bankEntry.create({
      data: {
        shipId,
        year,
        amountGco2eq: amount,
      },
    });
  }

  async applyBanked(shipId: string, year: number, amount: number): Promise<BankEntryEntity> {
    if (amount <= 0) {
      throw new Error("Amount must be positive to apply banked surplus");
    }
    // Create a negative entry to represent applying banked surplus
    return prisma.bankEntry.create({
      data: {
        shipId,
        year,
        amountGco2eq: -amount, // Negative to represent application
      },
    });
  }
}

