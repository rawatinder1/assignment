// src/core/domain/BankEntryEntity.ts

export interface BankEntryEntity {
  id: number;
  shipId: string;
  year: number;
  amountGco2eq: number; // Banked amount in gCO₂eq
}

