// src/core/application/routeActions.ts
"use server";

import { apiClient } from "@/adapters/infrastructure/apiClient";
import type { RouteEntity, RouteComparison } from "@/core/domain/RouteEntity";

export async function getRoutes(filters?: {
  vesselType?: string;
  fuelType?: string;
  year?: number;
}): Promise<RouteEntity[]> {
  return apiClient.getRoutes(filters);
}

export async function getComparison(): Promise<RouteComparison[]> {
  return apiClient.getComparison();
}

export async function setBaseline(routeId: number): Promise<{ message: string }> {
  return apiClient.setBaseline(routeId);
}

