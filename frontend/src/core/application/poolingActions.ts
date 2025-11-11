// src/core/application/poolingActions.ts
"use server";

import { apiClient } from "@/adapters/infrastructure/apiClient";
import type { PoolResult } from "@/core/domain/PoolEntity";

export async function createPool(
  year: number,
  members: Array<{ shipId: string }>
): Promise<PoolResult> {
  return apiClient.createPool(year, members);
}

