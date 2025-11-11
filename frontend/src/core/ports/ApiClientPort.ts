// src/core/ports/ApiClientPort.ts
import type { RouteEntity, RouteComparison } from "../domain/RouteEntity";
import type { ComplianceBalance, AdjustedComplianceBalance } from "../domain/ComplianceEntity";
import type { BankRecord, BankResult } from "../domain/BankingEntity";
import type { PoolResult } from "../domain/PoolEntity";

export interface ApiClientPort {
  getRoutes(filters?: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<RouteEntity[]>;
  getComparison(): Promise<RouteComparison[]>;
  setBaseline(routeId: number): Promise<{ message: string }>;
  getCB(shipId: string, year: number): Promise<ComplianceBalance>;
  getAdjustedCB(shipId: string, year: number): Promise<AdjustedComplianceBalance>;
  getBankRecords(shipId: string, year: number): Promise<BankRecord[]>;
  bankSurplus(shipId: string, year: number): Promise<BankResult>;
  applyBanked(shipId: string, year: number, amount: number): Promise<BankResult>;
  createPool(year: number, members: Array<{ shipId: string }>): Promise<PoolResult>;
}

