// src/core/application/ComputeCB.ts
import type { ComplianceRepositoryPort } from "../ports/ComplianceRepositoryPort.js";
import type { RouteRepositoryPort } from "../ports/RouteRepositoryPort.js";
import { calculateComplianceBalance } from "../domain/RouteEntity.js";

export async function computeCB(
  complianceRepo: ComplianceRepositoryPort,
  routeRepo: RouteRepositoryPort,
  shipId: string,
  year: number
) {
  // Get all routes for this ship (using routeId as shipId for now)
  const routes = await routeRepo.getAll();
  const shipRoutes = routes.filter((r) => r.id === Number(shipId) && r.year === year);

  if (shipRoutes.length === 0) {
    throw new Error(`No routes found for ship ${shipId} in year ${year}`);
  }

  // Calculate total CB across all routes for this ship/year
  let totalCB = 0;
  for (const route of shipRoutes) {
    totalCB += calculateComplianceBalance(route);
  }

  // Store or update the CB
  const cb = Math.round(totalCB);
  await complianceRepo.upsertCB({
    shipId,
    year,
    cbGco2eq: cb,
  });

  return {
    shipId,
    year,
    cb: cb,
  };
}

