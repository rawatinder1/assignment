// src/adapters/inbound/http/complianceController.ts
import { Request, Response } from "express";
import type { ComplianceRepositoryPort } from "../../../core/ports/ComplianceRepositoryPort.js";
import type { RouteRepositoryPort } from "../../../core/ports/RouteRepositoryPort.js";
import type { BankRepositoryPort } from "../../../core/ports/BankRepositoryPort.js";
import { computeCB } from "../../../core/application/ComputeCB.js";
import { getAdjustedCB } from "../../../core/application/GetAdjustedCB.js";

export function createComplianceController(
  complianceRepo: ComplianceRepositoryPort,
  routeRepo: RouteRepositoryPort,
  bankRepo: BankRepositoryPort
) {
  return {
    async getCB(req: Request, res: Response) {
      try {
        const shipId = req.query.shipId as string;
        const year = parseInt(req.query.year as string);

        if (!shipId || !year || isNaN(year)) {
          return res.status(400).json({ error: "shipId and year are required" });
        }

        // Compute CB if not exists, or return existing
        let cb = await complianceRepo.getCB(shipId, year);
        if (!cb) {
          // Compute and store CB
          const computed = await computeCB(complianceRepo, routeRepo, shipId, year);
          cb = await complianceRepo.getCB(shipId, year);
        }

        res.json({
          shipId: cb!.shipId,
          year: cb!.year,
          cb: cb!.cbGco2eq,
        });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },

    async getAdjustedCB(req: Request, res: Response) {
      try {
        const shipId = req.query.shipId as string;
        const year = parseInt(req.query.year as string);

        if (!shipId || !year || isNaN(year)) {
          return res.status(400).json({ error: "shipId and year are required" });
        }

        const adjusted = await getAdjustedCB(complianceRepo, bankRepo, shipId, year);
        res.json(adjusted);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  };
}

