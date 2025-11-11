// src/adapters/inbound/http/routesController.ts
import { Request, Response } from "express";
import type { RouteRepositoryPort } from "../../../core/ports/RouteRepositoryPort.js";
import { compareRoutes } from "../../../core/application/CompareRoutes.js";
import { setBaseline } from "../../../core/application/SetBaseline.js";

export function createRoutesController(routeRepo: RouteRepositoryPort) {
  return {
    async getAllRoutes(req: Request, res: Response) {
      try {
        const filters: { vesselType?: string; fuelType?: string; year?: number } = {};
        if (req.query.vesselType) {
          filters.vesselType = req.query.vesselType as string;
        }
        if (req.query.fuelType) {
          filters.fuelType = req.query.fuelType as string;
        }
        if (req.query.year) {
          filters.year = parseInt(req.query.year as string);
        }
        const routes = await routeRepo.getAll(Object.keys(filters).length > 0 ? filters : undefined);
        res.json(routes);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },

    async getComparison(req: Request, res: Response) {
      try {
        const comparison = await compareRoutes(routeRepo);
        res.json(comparison);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },

    async setBaselineRoute(req: Request, res: Response) {
      try {
        const routeId = parseInt(req.params.id);
        if (isNaN(routeId)) {
          return res.status(400).json({ error: "Invalid route ID" });
        }
        const result = await setBaseline(routeRepo, routeId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  };
}

