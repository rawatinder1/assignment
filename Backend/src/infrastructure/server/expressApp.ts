// src/infrastructure/server/expressApp.ts
import express from "express";
import { PrismaRouteRepository } from "../../adapters/outbound/postgres/PrismaRouteRepository.js";
import { PrismaComplianceRepository } from "../../adapters/outbound/postgres/PrismaComplianceRepository.js";
import { PrismaBankRepository } from "../../adapters/outbound/postgres/PrismaBankRepository.js";
import { PrismaPoolRepository } from "../../adapters/outbound/postgres/PrismaPoolRepository.js";
import { createRoutesController } from "../../adapters/inbound/http/routesController.js";
import { createComplianceController } from "../../adapters/inbound/http/complianceController.js";
import { createBankingController } from "../../adapters/inbound/http/bankingController.js";
import { createPoolingController } from "../../adapters/inbound/http/poolingController.js";

export function createApp() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize repositories
  const routeRepo = new PrismaRouteRepository();
  const complianceRepo = new PrismaComplianceRepository();
  const bankRepo = new PrismaBankRepository();
  const poolRepo = new PrismaPoolRepository();

  // Initialize controllers
  const routesController = createRoutesController(routeRepo);
  const complianceController = createComplianceController(
    complianceRepo,
    routeRepo,
    bankRepo
  );
  const bankingController = createBankingController(complianceRepo, bankRepo);
  const poolingController = createPoolingController(
    poolRepo,
    complianceRepo,
    bankRepo
  );

  // Routes
  app.get("/routes", routesController.getAllRoutes);
  app.get("/routes/comparison", routesController.getComparison);
  app.post("/routes/:id/baseline", routesController.setBaselineRoute);

  // Compliance endpoints
  app.get("/compliance/cb", complianceController.getCB);
  app.get("/compliance/adjusted-cb", complianceController.getAdjustedCB);

  // Banking endpoints
  app.get("/banking/records", bankingController.getBankRecords);
  app.post("/banking/bank", bankingController.bank);
  app.post("/banking/apply", bankingController.apply);

  // Pooling endpoints
  app.post("/pools", poolingController.createPool);

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}

