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
  ghgIntensity: number;
  isBaseline: boolean;
}

export interface RouteComparison {
  id: number;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  percentDiff: number;
  complianceBalance: number;
  isCompliant: boolean;
}

