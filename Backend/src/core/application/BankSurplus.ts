// src/core/application/BankSurplus.ts
import type { ComplianceRepositoryPort } from "../ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../ports/BankRepositoryPort.js";

export async function bankSurplus(
  complianceRepo: ComplianceRepositoryPort,
  bankRepo: BankRepositoryPort,
  shipId: string,
  year: number
) {
  // Get current CB
  const cb = await complianceRepo.getCB(shipId, year);
  if (!cb) {
    throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
  }

  // Only bank if CB is positive (surplus)
  if (cb.cbGco2eq <= 0) {
    throw new Error(`Cannot bank: Compliance Balance (${cb.cbGco2eq}) is not positive`);
  }

  // Bank the entire positive CB
  const bankEntry = await bankRepo.bankSurplus(shipId, year, cb.cbGco2eq);

  return {
    shipId,
    year,
    cbBefore: cb.cbGco2eq,
    banked: cb.cbGco2eq,
    cbAfter: 0, // After banking, CB becomes 0
  };
}

