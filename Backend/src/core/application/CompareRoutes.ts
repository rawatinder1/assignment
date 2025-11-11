import type { RouteRepositoryPort } from "../ports/RouteRepositoryPort.js";
import {
  calculatePercentDiff,
  calculateComplianceBalance,
  isCompliant,
} from "../domain/RouteEntity.js";

export async function compareRoutes(repo: RouteRepositoryPort) {
  const baseline = await repo.getBaseline();
  if (!baseline) throw new Error("No baseline route set.");

  const allRoutes = await repo.getAll();

  return allRoutes.map((route) => {
    const percentDiff = calculatePercentDiff(route, baseline);
    const complianceBalance = calculateComplianceBalance(route);

    return {
      id: route.id,
      routeId: route.routeId,
      vesselType: route.vesselType,
      fuelType: route.fuelType,
      year: route.year,
      ghgIntensity: route.ghgIntensity,
      fuelConsumption: route.fuelConsumption,
      percentDiff: parseFloat(percentDiff.toFixed(2)),
      complianceBalance: Math.round(complianceBalance),
      isCompliant: isCompliant(route),
    };
  });
}