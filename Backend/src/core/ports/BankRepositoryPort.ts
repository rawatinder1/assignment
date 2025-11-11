// src/core/ports/BankRepositoryPort.ts
import type { BankEntryEntity } from "../domain/BankEntryEntity.js";

export interface BankRepositoryPort {
  getBankedAmount(shipId: string, year: number): Promise<number>;
  getBankRecords(shipId: string, year: number): Promise<BankEntryEntity[]>;
  bankSurplus(shipId: string, year: number, amount: number): Promise<BankEntryEntity>;
  applyBanked(shipId: string, year: number, amount: number): Promise<BankEntryEntity>;
}

