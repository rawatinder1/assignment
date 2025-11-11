// src/core/domain/BankingEntity.ts

export interface BankRecord {
  id: number;
  shipId: string;
  year: number;
  amountGco2eq: number;
}

export interface BankResult {
  shipId: string;
  year: number;
  cbBefore: number;
  banked?: number;
  applied?: number;
  cbAfter: number;
}

