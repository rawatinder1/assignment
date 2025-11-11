// src/core/domain/RouteEntity.ts

export interface RouteEntity {
  id: number;
  routeId: string;
  year: number;
  vesselType: string;
  fuelType: string;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  ghgIntensity: number; // gCO2e / MJ
  isBaseline: boolean;
}

// Regulatory target
const TARGET_INTENSITY = 89.3368; // gCO₂e/MJ (calculated as per the FUELEU maritime regulation(EU 2023/1805))
const ENERGY_PER_TONNE = 41000;   // MJ per tonne fuel

/**
 * Calculates % difference vs. baseline route.
 */
export function calculatePercentDiff(route: RouteEntity, baseline: RouteEntity): number {
  return ((route.ghgIntensity - baseline.ghgIntensity) / baseline.ghgIntensity) * 100;
}

/**
 * Calculates total energy in scope (MJ)
 */
export function calculateEnergyInScope(fuelConsumption: number): number {
  return fuelConsumption * ENERGY_PER_TONNE;
}

/**
 * Calculates the Compliance Balance (CB)
 * Positive CB → Surplus (below target)
 * Negative CB → Deficit (above target)
 */
export function calculateComplianceBalance(route: RouteEntity): number {
  const energy = calculateEnergyInScope(route.fuelConsumption);
  return (TARGET_INTENSITY - route.ghgIntensity) * energy;
}

/**
 * Determines if a route is compliant with the regulatory target.
 */
export function isCompliant(route: RouteEntity): boolean {
  const cb = calculateComplianceBalance(route);
  return cb >= 0; // Surplus if below or equal to target intensity
}