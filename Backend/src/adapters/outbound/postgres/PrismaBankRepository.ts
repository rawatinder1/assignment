// src/adapters/outbound/postgres/PrismaBankRepository.ts
import { prisma } from "../../../infrastructure/db/prisma.js";
import type { BankRepositoryPort } from "../../../core/ports/BankRepositoryPort.js";
import type { BankEntryEntity } from "../../../core/domain/BankEntryEntity.js";

export class PrismaBankRepository implements BankRepositoryPort {
  async getBankedAmount(shipId: string, year: number): Promise<number> {
    // Get all entries (both positive for banking and negative for applying)
    const entries = await prisma.bankEntry.findMany({
      where: { shipId, year },
    });
    // Sum all entries: positive entries (banking) - negative entries (applying)
    // This gives the net banked amount available (for applying banked surplus)
    return entries.reduce((sum, entry) => sum + entry.amountGco2eq, 0);
  }

  async getTotalBankedAmount(shipId: string, year: number): Promise<number> {
    // Get only positive entries (banking operations)
    const entries = await prisma.bankEntry.findMany({
      where: { 
        shipId, 
        year,
        amountGco2eq: { gt: 0 } // Only positive entries (banking operations)
      },
    });
    // Sum only positive entries to get total amount banked
    // This is used for validation: you can't bank more than Base CB - Total Banked
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

