// src/adapters/outbound/postgres/PrismaRouteRepository.ts
import { prisma } from "../../../infrastructure/db/prisma.js";
import type { RouteRepositoryPort } from "../../../core/ports/RouteRepositoryPort.js";

export class PrismaRouteRepository implements RouteRepositoryPort {
  async getAll(filters?: { vesselType?: string; fuelType?: string; year?: number }) {
    const where: any = {};
    if (filters?.vesselType) {
      where.vesselType = filters.vesselType;
    }
    if (filters?.fuelType) {
      where.fuelType = filters.fuelType;
    }
    if (filters?.year) {
      where.year = filters.year;
    }
    return prisma.route.findMany({ where });
  }

  async getBaseline() {
    return prisma.route.findFirst({ where: { isBaseline: true } });
  }

  async setBaseline(routeId: number) {
    // Unset all baselines first
    await prisma.route.updateMany({ data: { isBaseline: false } });

    // Set the new baseline
    return prisma.route.update({
      where: { id: routeId },
      data: { isBaseline: true },
    });
  }
}