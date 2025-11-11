// src/adapters/inbound/http/poolingController.ts
import { Request, Response } from "express";
import type { PoolRepositoryPort } from "../../../core/ports/PoolRepositoryPort.js";
import type { ComplianceRepositoryPort } from "../../../core/ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../../../core/ports/BankRepositoryPort.js";
import { createPool } from "../../../core/application/CreatePool.js";

export function createPoolingController(
  poolRepo: PoolRepositoryPort,
  complianceRepo: ComplianceRepositoryPort,
  bankRepo: BankRepositoryPort
) {
  return {
    async createPool(req: Request, res: Response) {
      try {
        const { year, members } = req.body;

        if (!year || !members || !Array.isArray(members) || members.length === 0) {
          return res.status(400).json({
            error: "year and members (array of {shipId}) are required",
          });
        }

        const result = await createPool(
          poolRepo,
          complianceRepo,
          bankRepo,
          year,
          members
        );
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    },
  };
}

