// src/core/application/GetAdjustedCB.ts
import type { ComplianceRepositoryPort } from "../ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../ports/BankRepositoryPort.js";

export async function getAdjustedCB(
  complianceRepo: ComplianceRepositoryPort,
  bankRepo: BankRepositoryPort,
  shipId: string,
  year: number
) {
  // Get base CB
  const baseCB = await complianceRepo.getCB(shipId, year);
  if (!baseCB) {
    throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
  }

  // Get all bank entries (both positive and negative)
  const bankRecords = await bankRepo.getBankRecords(shipId, year);
  
  // Calculate net banked amount (positive entries minus applied amounts)
  const netBanked = bankRecords.reduce((sum, entry) => sum + entry.amountGco2eq, 0);

  // Adjusted CB = base CB + net banked
  const adjustedCB = baseCB.cbGco2eq + netBanked;

  return {
    shipId,
    year,
    cbBefore: baseCB.cbGco2eq,
    netBanked: Math.round(netBanked),
    cbAfter: Math.round(adjustedCB),
  };
}

