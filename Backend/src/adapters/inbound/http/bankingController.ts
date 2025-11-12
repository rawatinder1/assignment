// src/adapters/inbound/http/bankingController.ts
import { Request, Response } from "express";
import type { ComplianceRepositoryPort } from "../../../core/ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../../../core/ports/BankRepositoryPort.js";
import { bankSurplus } from "../../../core/application/BankSurplus.js";
import { applyBanked } from "../../../core/application/ApplyBanked.js";

export function createBankingController(
  complianceRepo: ComplianceRepositoryPort,
  bankRepo: BankRepositoryPort
) {
  return {
    async getBankRecords(req: Request, res: Response) {
      try {
        const shipId = req.query.shipId as string;
        const year = parseInt(req.query.year as string);

        if (!shipId || !year || isNaN(year)) {
          return res.status(400).json({ error: "shipId and year are required" });
        }

        const records = await bankRepo.getBankRecords(shipId, year);
        res.json(records);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },

    async bank(req: Request, res: Response) {
      try {
        const { shipId, year, amount } = req.body;

        if (!shipId || !year) {
          return res.status(400).json({ error: "shipId and year are required" });
        }

        if (!amount || typeof amount !== "number" || amount <= 0) {
          return res.status(400).json({ error: "amount must be a positive number" });
        }

        const result = await bankSurplus(complianceRepo, bankRepo, shipId, year, amount);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    },

    async apply(req: Request, res: Response) {
      try {
        const { shipId, year, amount } = req.body;

        if (!shipId || !year || !amount) {
          return res.status(400).json({ error: "shipId, year, and amount are required" });
        }

        if (typeof amount !== "number" || amount <= 0) {
          return res.status(400).json({ error: "amount must be a positive number" });
        }

        const result = await applyBanked(complianceRepo, bankRepo, shipId, year, amount);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    },
  };
}

