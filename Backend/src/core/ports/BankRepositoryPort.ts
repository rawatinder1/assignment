// src/core/ports/BankRepositoryPort.ts
import type { BankEntryEntity } from "../domain/BankEntryEntity.js";

export interface BankRepositoryPort {
  getBankedAmount(shipId: string, year: number): Promise<number>; // Returns net amount (positive - negative) for applying
  getTotalBankedAmount(shipId: string, year: number): Promise<number>; // Returns total amount banked (sum of positive entries only) for validation
  getBankRecords(shipId: string, year: number): Promise<BankEntryEntity[]>;
  bankSurplus(shipId: string, year: number, amount: number): Promise<BankEntryEntity>;
  applyBanked(shipId: string, year: number, amount: number): Promise<BankEntryEntity>;
}

