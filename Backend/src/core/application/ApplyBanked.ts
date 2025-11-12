// src/core/application/ApplyBanked.ts
import type { ComplianceRepositoryPort } from "../ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../ports/BankRepositoryPort.js";

/**
 * Apply banked surplus according to Article 20.
 * Applying banked surplus increases the current CB.
 */
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

  // Get current base CB
  const cb = await complianceRepo.getCB(shipId, year);
  if (!cb) {
    throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
  }

  // Get available banked amount (net: positive entries - negative entries)
  const availableBanked = await bankRepo.getBankedAmount(shipId, year);
  if (amount > availableBanked) {
    throw new Error(
      `Cannot apply ${amount}: only ${availableBanked} available in bank`
    );
  }

  // Apply the banked amount (creates negative entry to reduce banked amount)
  await bankRepo.applyBanked(shipId, year, amount);

  // Calculate new CB after application (base CB + applied amount)
  const cbAfter = Math.round(cb.cbGco2eq + amount);

  // Update CB in database - applying banked increases CB
  await complianceRepo.upsertCB({
    shipId,
    year,
    cbGco2eq: cbAfter,
  });

  return {
    shipId,
    year,
    cbBefore: cb.cbGco2eq,
    applied: amount,
    cbAfter,
  };
}

