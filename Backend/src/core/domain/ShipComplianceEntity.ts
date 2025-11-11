// src/core/domain/ShipComplianceEntity.ts

export interface ShipComplianceEntity {
  id: number;
  shipId: string;
  year: number;
  cbGco2eq: number; // Compliance Balance in gCO₂eq
}

