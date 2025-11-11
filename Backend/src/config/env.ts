// src/config/env.ts
import dotenv from "dotenv";
import path from "path";

// Load the .env file relative to project root
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not found in .env");
}

export const ENV = {
  DATABASE_URL: process.env.DATABASE_URL!,
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
};