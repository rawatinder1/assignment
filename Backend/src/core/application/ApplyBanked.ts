// src/core/application/ApplyBanked.ts
import type { ComplianceRepositoryPort } from "../ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../ports/BankRepositoryPort.js";

export async function applyBanked(
  complianceRepo: ComplianceRepositoryPort,
  bankRepo: BankRepositoryPort,
  shipId: string,
  year: number,
  amount: number
) {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  // Get current CB
  const cb = await complianceRepo.getCB(shipId, year);
  if (!cb) {
    throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
  }

  // Get available banked amount
  const availableBanked = await bankRepo.getBankedAmount(shipId, year);
  if (amount > availableBanked) {
    throw new Error(
      `Cannot apply ${amount}: only ${availableBanked} available in bank`
    );
  }

  // Apply the banked amount
  await bankRepo.applyBanked(shipId, year, amount);

  // Calculate new CB after application
  const cbAfter = cb.cbGco2eq + amount;

  return {
    shipId,
    year,
    cbBefore: cb.cbGco2eq,
    applied: amount,
    cbAfter: Math.round(cbAfter),
  };
}

