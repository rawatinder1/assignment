// src/core/application/complianceActions.ts
"use server";

import { apiClient } from "@/adapters/infrastructure/apiClient";
import type { ComplianceBalance, AdjustedComplianceBalance } from "@/core/domain/ComplianceEntity";

export async function getCB(
  shipId: string,
  year: number
): Promise<ComplianceBalance> {
  return apiClient.getCB(shipId, year);
}

export async function getAdjustedCB(
  shipId: string,
  year: number
): Promise<AdjustedComplianceBalance> {
  return apiClient.getAdjustedCB(shipId, year);
}

