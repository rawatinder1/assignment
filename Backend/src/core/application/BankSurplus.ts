// src/core/application/BankSurplus.ts
import type { ComplianceRepositoryPort } from "../ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../ports/BankRepositoryPort.js";

/**
 * Bank surplus according to Article 20.
 * Banking stores surplus for future use but does NOT modify the base CB.
 * The base CB remains unchanged - only the banked amount is tracked.
 */
export async function bankSurplus(
  complianceRepo: ComplianceRepositoryPort,
  bankRepo: BankRepositoryPort,
  shipId: string,
  year: number,
  amount: number
) {
  // Get current CB (base CB, not adjusted)
  const cb = await complianceRepo.getCB(shipId, year);
  if (!cb) {
    throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
  }

  // Only bank if CB is positive (surplus)
  if (cb.cbGco2eq <= 0) {
    throw new Error(`Cannot bank: Compliance Balance (${cb.cbGco2eq}) is not positive`);
  }

  // Validate amount
  if (amount <= 0) {
    throw new Error(`Amount must be positive`);
  }

  if (amount > cb.cbGco2eq) {
    throw new Error(`Cannot bank ${amount}: only ${cb.cbGco2eq} available`);
  }

  // Get current available banked amount
  const currentBanked = await bankRepo.getBankedAmount(shipId, year);
  const maxBankable = cb.cbGco2eq; // Can bank up to current CB
  
  if (amount > maxBankable) {
    throw new Error(`Cannot bank ${amount}: maximum bankable is ${maxBankable}`);
  }
  
  // Bank the specified amount (creates positive entry)
  await bankRepo.bankSurplus(shipId, year, amount);

  // Base CB remains unchanged - banking doesn't modify it
  // Only the banked amount increases

  return {
    shipId,
    year,
    cbBefore: cb.cbGco2eq,
    banked: amount,
    cbAfter: cb.cbGco2eq, // CB unchanged after banking
  };
}

