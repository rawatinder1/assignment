// src/adapters/outbound/postgres/PrismaComplianceRepository.ts
import { prisma } from "../../../infrastructure/db/prisma.js";
import type { ComplianceRepositoryPort } from "../../../core/ports/ComplianceRepositoryPort.js";
import type { ShipComplianceEntity } from "../../../core/domain/ShipComplianceEntity.js";

export class PrismaComplianceRepository implements ComplianceRepositoryPort {
  async getCB(shipId: string, year: number): Promise<ShipComplianceEntity | null> {
    const result = await prisma.shipCompliance.findFirst({
      where: { shipId, year },
    });
    return result;
  }

  async saveCB(compliance: Omit<ShipComplianceEntity, "id">): Promise<ShipComplianceEntity> {
    return prisma.shipCompliance.create({ data: compliance });
  }

  async upsertCB(compliance: Omit<ShipComplianceEntity, "id">): Promise<ShipComplianceEntity> {
    const existing = await prisma.shipCompliance.findFirst({
      where: {
        shipId: compliance.shipId,
        year: compliance.year,
      },
    });

    if (existing) {
      return prisma.shipCompliance.update({
        where: { id: existing.id },
        data: { cbGco2eq: compliance.cbGco2eq },
      });
    } else {
      return prisma.shipCompliance.create({
        data: compliance,
      });
    }
  }
}

