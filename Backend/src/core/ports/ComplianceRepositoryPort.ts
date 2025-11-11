// src/core/ports/ComplianceRepositoryPort.ts
import type { ShipComplianceEntity } from "../domain/ShipComplianceEntity.js";

export interface ComplianceRepositoryPort {
  getCB(shipId: string, year: number): Promise<ShipComplianceEntity | null>;
  saveCB(compliance: Omit<ShipComplianceEntity, "id">): Promise<ShipComplianceEntity>;
  upsertCB(compliance: Omit<ShipComplianceEntity, "id">): Promise<ShipComplianceEntity>;
}

