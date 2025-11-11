// src/core/ports/RouteRepositoryPort.ts
import type { RouteEntity } from "../domain/RouteEntity.js";

export interface RouteRepositoryPort {
  getAll(filters?: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<RouteEntity[]>;
  getBaseline(): Promise<RouteEntity | null>;
  setBaseline(routeId: number): Promise<RouteEntity>;
}