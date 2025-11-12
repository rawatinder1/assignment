// src/core/application/GetAdjustedCB.ts
import type { ComplianceRepositoryPort } from "../ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../ports/BankRepositoryPort.js";

/**
 * Get adjusted CB according to Article 20.
 * Adjusted CB = Base CB + Available Banked Amount
 * This represents what the CB would be if all banked surplus was applied.
 * Used for pooling calculations (Article 21).
 */
export async function getAdjustedCB(
  complianceRepo: ComplianceRepositoryPort,
  bankRepo: BankRepositoryPort,
  shipId: string,
  year: number
) {
  // Get base CB (from routes calculation, not modified by banking)
  const baseCB = await complianceRepo.getCB(shipId, year);
  if (!baseCB) {
    throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
  }

  // Get available banked amount (net: positive entries - negative entries)
  // This is the net amount that can be applied (after accounting for previous applications)
  const bankedAmount = await bankRepo.getBankedAmount(shipId, year);

  // Adjusted CB = base CB + available banked amount
  // This is what CB would be if all banked surplus was applied
  const adjustedCB = baseCB.cbGco2eq + bankedAmount;

  return {
    shipId,
    year,
    cbBefore: baseCB.cbGco2eq,
    bankedAmount: Math.round(bankedAmount),
    cbAfter: Math.round(adjustedCB),
  };
}

