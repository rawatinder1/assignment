// src/core/application/BankSurplus.ts
import type { ComplianceRepositoryPort } from "../ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../ports/BankRepositoryPort.js";

/**
 * Bank surplus according to Article 20 of FuelEU Maritime Regulation.
 * 
 * Banking surplus moves available CB to banked storage for future use.
 * The base CB (calculated from routes) remains unchanged, but the available
 * CB for banking is reduced by the amount already banked.
 * 
 * Key rule: You can only bank what's available = Base CB - Already Banked Amount
 * This prevents double-banking the same surplus multiple times.
 */
export async function bankSurplus(
  complianceRepo: ComplianceRepositoryPort,
  bankRepo: BankRepositoryPort,
  shipId: string,
  year: number,
  amount: number
) {
  // Get base CB (calculated from routes, never changes)
  const baseCB = await complianceRepo.getCB(shipId, year);
  if (!baseCB) {
    throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
  }

  // Only bank if base CB is positive (surplus)
  if (baseCB.cbGco2eq <= 0) {
    throw new Error(`Cannot bank: Compliance Balance (${baseCB.cbGco2eq}) is not positive`);
  }

  // Validate amount
  if (amount <= 0) {
    throw new Error(`Amount must be positive`);
  }

  // Get total amount banked (sum of positive entries only)
  // This is different from getBankedAmount which returns net (positive - negative)
  // For validation, we need to know how much has been banked total, regardless of applications
  const totalBanked = await bankRepo.getTotalBankedAmount(shipId, year);
  
  // Calculate available CB for banking = Base CB - Total Banked
  // This ensures we can't bank more than what's actually available
  // Example: Base CB = 8000, Banked 4000, Available = 4000 (can't bank more than 4000)
  const availableCB = baseCB.cbGco2eq - totalBanked;
  
  if (availableCB <= 0) {
    throw new Error(
      `No available surplus to bank. Base CB: ${baseCB.cbGco2eq}, Total banked: ${totalBanked}`
    );
  }

  if (amount > availableCB) {
    throw new Error(
      `Cannot bank ${amount}: only ${availableCB} available ` +
      `(Base CB: ${baseCB.cbGco2eq}, Total banked: ${totalBanked})`
    );
  }
  
  // Bank the specified amount (creates positive entry)
  await bankRepo.bankSurplus(shipId, year, amount);

  // Base CB remains unchanged (it's calculated from routes)
  // But the available CB for future banking is now reduced by 'amount'
  // Available CB after banking = baseCB - (totalBanked + amount)

  return {
    shipId,
    year,
    cbBefore: baseCB.cbGco2eq,
    totalBankedBefore: totalBanked,
    availableBefore: availableCB,
    banked: amount,
    totalBankedAfter: totalBanked + amount,
    availableAfter: availableCB - amount,
    cbAfter: baseCB.cbGco2eq, // Base CB unchanged
  };
}

