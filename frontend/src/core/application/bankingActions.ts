// src/core/application/bankingActions.ts
"use server";

import { apiClient } from "@/adapters/infrastructure/apiClient";
import type { BankRecord, BankResult } from "@/core/domain/BankingEntity";

export async function getBankRecords(
  shipId: string,
  year: number
): Promise<BankRecord[]> {
  return apiClient.getBankRecords(shipId, year);
}

export async function bankSurplus(
  shipId: string,
  year: number
): Promise<BankResult> {
  return apiClient.bankSurplus(shipId, year);
}

export async function applyBanked(
  shipId: string,
  year: number,
  amount: number
): Promise<BankResult> {
  return apiClient.applyBanked(shipId, year, amount);
}

