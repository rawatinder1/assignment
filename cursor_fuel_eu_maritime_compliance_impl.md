# Fuel EU Maritime compliance implementation discussion
_Exported on 11/12/2025 at 14:56:17 GMT+5:30 from Cursor (2.0.69)_

---

**User**

hey when i bank surplus some x amount shouldnt that amount be deducted from the current CB because if not some a ship owner can bank multiple time same amount and the banked surplus for that year could increase or sum up more than he has eventually what the fuelEU regulation on this and what does the doc says how to implement it # FullStack Developer
could you see the current implementation and the required one acoording fuel EU sent below and if different fix it # FuelEU Maritime — Full-Stack Developer Assignment

This assignment assesses your **engineering ability**, **architectural clarity**, and **use of AI agents** (such as *GitHub Copilot*, *Claude Code*, *Cursor Agent*, *OpenAI Codex*, etc.).

You will implement parts of a **Fuel EU Maritime compliance platform**: the frontend dashboard and backend APIs handling route data, compliance balance (CB), banking, and pooling.

---

## 🔍 General Objective

Build a minimal yet structured implementation of the Fuel EU Maritime compliance module with:

- **Frontend:** React + TypeScript + TailwindCSS
- **Backend:** Node.js + TypeScript + PostgreSQL
- **Architecture:** Hexagonal (Ports & Adapters / Clean Architecture)
- **Documentation:** AI-agent usage markdowns (mandatory)
- **Focus:**
    - Quality of domain modeling and separation of concerns
    - Use of AI-agents efficiently (generation, refactoring, testing)
    - Proper explanation of how those tools were used

---

## 🧠 AI Agent Usage & Documentation (Mandatory)

You **must** include the following markdown files:

### 1. `AGENT_WORKFLOW.md`

Document your agent usage, with the following sections:

```markdown
# AI Agent Workflow Log

## Agents Used
List all agents (Copilot, Claude Code, Cursor Agent, etc.)

## Prompts & Outputs
- Example 1: include the exact prompt and the generated snippet
- Example 2: show how you refined or corrected an output

## Validation / Corrections
Describe how you verified and modified the agent output.

## Observations
- Where agent saved time
- Where it failed or hallucinated
- How you combined tools effectively

## Best Practices Followed
(e.g., used Cursor’s `tasks.md` for code generation, Copilot inline completions for boilerplate, Claude Code for refactoring)

```

### 2. `README.md`

Include:

- Overview
- Architecture summary (hexagonal structure)
- Setup & run instructions
- How to execute tests
- Screenshots or sample requests/responses

### 3. `REFLECTION.md`

Short essay (max 1 page):

- What you learned using AI agents
- Efficiency gains vs manual coding
- Improvements you’d make next time

---

# 🔷 FRONTEND TASK — React + Tailwind

## 🎯 Objective

Create a **Fuel EU Compliance Dashboard** with four tabs:

1. **Routes**
2. **Compare**
3. **Banking**
4. **Pooling**

All values and API responses originate from the backend service described below.

---

## 🧩 Architecture (Hexagonal pattern)

```
src/
  core/
    domain/
    application/
    ports/
  adapters/
    ui/
    infrastructure/
  shared/

```

- Core = domain entities, use-cases, and ports (no React dependencies)
- UI adapters = React components and hooks implementing inbound ports
- Infrastructure adapters = API clients implementing outbound ports
- Styling via TailwindCSS

---

## 🧱 Functional Requirements

### (1) Routes Tab

- Display table of all routes fetched from `/routes`
- Columns: routeId, vesselType, fuelType, year, ghgIntensity (gCO₂e/MJ), fuelConsumption (t), distance (km), totalEmissions (t)
- “Set Baseline” button → calls `POST /routes/:routeId/baseline`
- Filters: vesselType, fuelType, year

### (2) Compare Tab

- Fetch baseline + comparison data from `/routes/comparison`
- Use target = **89.3368 gCO₂e/MJ** (2 % below 91.16)
- Display:
    - Table with baseline vs comparison routes
    - Columns: ghgIntensity, % difference, compliant (✅ / ❌)
    - Chart (bar/line) comparing ghgIntensity values
- Formula:
    
    `percentDiff = ((comparison / baseline) − 1) × 100`
    

### (3) Banking Tab

Implements Fuel EU **Article 20 – Banking**.

- `GET /compliance/cb?year=YYYY` → shows current CB
- `POST /banking/bank` → banks positive CB
- `POST /banking/apply` → applies banked surplus to a deficit
- KPIs:
    - `cb_before`, `applied`, `cb_after`
- Disable actions if CB ≤ 0; show errors from API

### (4) Pooling Tab

Implements Fuel EU **Article 21 – Pooling**.

- `GET /compliance/adjusted-cb?year=YYYY` → fetch adjusted CB per ship
- `POST /pools` → create pool with members
- Rules:
    - Sum(adjustedCB) ≥ 0
    - Deficit ship cannot exit worse
    - Surplus ship cannot exit negative
- UI:
    - List members with before/after CBs
    - Pool Sum indicator (red/green)
    - Disable “Create Pool” if invalid

---

## 📊 KPIs Dataset (for mock or seed data)

| routeId | vesselType | fuelType | year | ghgIntensity | fuelConsumption (t) | distance (km) | totalEmissions (t) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R001 | Container | HFO | 2024 | 91.0 | 5000 | 12000 | 4500 |
| R002 | BulkCarrier | LNG | 2024 | 88.0 | 4800 | 11500 | 4200 |
| R003 | Tanker | MGO | 2024 | 93.5 | 5100 | 12500 | 4700 |
| R004 | RoRo | HFO | 2025 | 89.2 | 4900 | 11800 | 4300 |
| R005 | Container | LNG | 2025 | 90.5 | 4950 | 11900 | 4400 |

---

## ✅ Evaluation Checklist

| Area | Criteria |
| --- | --- |
| Architecture | Proper hexagonal separation (core ↔️ adapters) |
| Functionality | Routes, Compare, Banking, Pooling tabs work as specified |
| Code Quality | TS strict mode, ESLint/Prettier, clean naming |
| UI | Responsive, accessible, clear data visualization |
| AI-Agent Use | Quality and depth of AGENT_WORKFLOW.md + prompts |
| Testing | Unit tests for use-cases and components |

---

# 🔶 BACKEND TASK — Node.js + TypeScript + PostgreSQL

## 🎯 Objective

Build APIs backing the Fuel EU Dashboard:

- Manage Routes & Comparisons
- Calculate Compliance Balance (CB)
- Handle Banking and Pooling logic

---

## ⚙️ Architecture (Hexagonal)

```
src/
  core/
    domain/
    application/
    ports/
  adapters/
    inbound/http/
    outbound/postgres/
  infrastructure/
    db/
    server/
  shared/

```

Use dependency-inverted modules:

core → ports → adapters.

Frameworks (Express/Prisma/etc.) only in adapters/infrastructure.

---

## 🧱 Database Schema

| Table | Key Columns | Purpose |
| --- | --- | --- |
| routes | id, route_id, year, ghg_intensity, is_baseline | basic data |
| ship_compliance | id, ship_id, year, cb_gco2eq | computed CB records |
| bank_entries | id, ship_id, year, amount_gco2eq | banked surplus |
| pools | id, year, created_at | pool registry |
| pool_members | pool_id, ship_id, cb_before, cb_after | allocations |

Seed the five routes above; set one baseline = true.

---

## 🧮 Core Formulas

- **Target Intensity (2025)** = 89.3368 gCO₂e/MJ
- **Energy in scope (MJ)** ≈ fuelConsumption × 41 000 MJ/t
- **Compliance Balance** = ( Target − Actual ) × Energy in scope
- Positive CB → Surplus ; Negative → Deficit

---

## 🔗 Endpoints

### `/routes`

- `GET /routes` → all routes
- `POST /routes/:id/baseline` → set baseline
- `GET /routes/comparison` → baseline vs others
    - `percentDiff` and `compliant` flags

### `/compliance`

- `GET /compliance/cb?shipId&year`
    - Compute and store CB snapshot
- `GET /compliance/adjusted-cb?shipId&year`
    - Return CB after bank applications

### `/banking`

- `GET /banking/records?shipId&year`
- `POST /banking/bank` — bank positive CB
- `POST /banking/apply` — apply banked surplus
    - Validate amount ≤ available banked

### `/pools`

- `POST /pools`
    - Validate ∑ CB ≥ 0
    - Enforce:
        - Deficit ship cannot exit worse
        - Surplus ship cannot exit negative
    - Greedy allocation:
        - Sort members desc by CB
        - Transfer surplus to deficits
    - Return `cb_after` per member

---

## 🧪 Testing Checklist

- **Unit** — ComputeComparison, ComputeCB, BankSurplus, ApplyBanked, CreatePool
- **Integration** — HTTP endpoints via Supertest
- **Data** — Migrations + Seeds load correctly
- **Edge cases** — Negative CB, over-apply bank, invalid pool

---

## ✅ Evaluation Checklist

| Area | Criteria |
| --- | --- |
| Architecture | Ports & Adapters; no core ↔️ framework coupling |
| Logic Correctness | CB, banking, pooling math matches spec |
| Code Quality | TypeScript strict, tests pass, ESLint clean |
| Docs | AGENT_WORKFLOW.md + README complete |
| AI Agent Use | Clarity of prompts, logs, and validation steps |

---

## 📦 Submission Instructions

1. Create a **public GitHub repository** with two folders:
    - `/frontend`
    - `/backend`
2. Include:
    - `AGENT_WORKFLOW.md`
    - `README.md`
    - `REFLECTION.md`
3. Ensure `npm run test` and `npm run dev` both work.
4. Commit history must show incremental progress (not one single dump).
5. Deadline: *72 hours from assignment receipt*.

---

### 📘 Reference

All constants, CB formula, and banking/pooling rules follow

**Fuel EU Maritime Regulation (EU) 2023/1805**, Annex IV and Articles 20–21 (see pp. 27 & 104–107). 

[2025-May-ESSF-SAPS-WS1-FuelEU-calculation-methodologies.pdf](attachment:77cebf3f-450a-40ae-b14c-2d7f629c7973:2025-May-ESSF-SAPS-WS1-FuelEU-calculation-methodologies_(1).pdf)

---

This is your full brief. Deliver clean code, structured repositories, and transparent documentation of AI-agent collaboration.

---

**Cursor**


Reviewing the banking implementation and FuelEU requirements. Checking the current code and the regulation document.



Checking the FuelEU regulation document and related documentation:



Checking how the banked amount is calculated and what the current CB represents:



The issue: banking doesn't account for already banked amounts, allowing double-banking. Fixing it:



Fixing the validation: it should check against available CB (base CB minus already banked amount), not just base CB. Updating the logic:


```typescript
// src/core/application/BankSurplus.ts
import type { ComplianceRepositoryPort } from "../ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../ports/BankRepositoryPort.js";

/**
 * Bank surplus according to Article 20 of FuelEU Maritime Regulation.
 * 
 * Banking surplus moves available CB to banked storage for future use.
 * The base CB (calculated from routes) remains unchanged, but the available
 * CB for banking is reduced by the amount already banked.
 * 
 * Key rule: You can only bank what's available = Base CB - Already Banked Amount
 * This prevents double-banking the same surplus multiple times.
 */
export async function bankSurplus(
  complianceRepo: ComplianceRepositoryPort,
  bankRepo: BankRepositoryPort,
  shipId: string,
  year: number,
  amount: number
) {
  // Get base CB (calculated from routes, never changes)
  const baseCB = await complianceRepo.getCB(shipId, year);
  if (!baseCB) {
    throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
  }

  // Only bank if base CB is positive (surplus)
  if (baseCB.cbGco2eq <= 0) {
    throw new Error(`Cannot bank: Compliance Balance (${baseCB.cbGco2eq}) is not positive`);
  }

  // Validate amount
  if (amount <= 0) {
    throw new Error(`Amount must be positive`);
  }

  // Get current banked amount (already banked surplus for this year)
  const alreadyBanked = await bankRepo.getBankedAmount(shipId, year);
  
  // Calculate available CB for banking = Base CB - Already Banked
  // This ensures we can't bank more than what's actually available
  const availableCB = baseCB.cbGco2eq - alreadyBanked;
  
  if (availableCB <= 0) {
    throw new Error(`No available surplus to bank. Base CB: ${baseCB.cbGco2eq}, Already banked: ${alreadyBanked}`);
  }

  if (amount > availableCB) {
    throw new Error(
      `Cannot bank ${amount}: only ${availableCB} available ` +
      `(Base CB: ${baseCB.cbGco2eq}, Already banked: ${alreadyBanked})`
    );
  }
  
  // Bank the specified amount (creates positive entry)
  await bankRepo.bankSurplus(shipId, year, amount);

  // Base CB remains unchanged (it's calculated from routes)
  // But the available CB for future banking is now reduced by 'amount'
  // Available CB after banking = baseCB - (alreadyBanked + amount)

  return {
    shipId,
    year,
    cbBefore: baseCB.cbGco2eq,
    availableBefore: availableCB,
    banked: amount,
    availableAfter: availableCB - amount,
    cbAfter: baseCB.cbGco2eq, // Base CB unchanged
  };
}


```


Checking for TypeScript errors and verifying the return type matches what the controller expects:



Checking if the frontend expects a specific return structure:



Checking the BankResult type definition:



The return type matches the expected interface. The extra fields (`availableBefore`, `availableAfter`) are additional info and won't break the frontend. Verifying the fix and updating the todos:



Noting that `getBankedAmount` only sums positive entries. This is fine for banking validation, but applying banked creates negative entries, so the available banked amount should account for both. That's a separate issue. The fix prevents double-banking. Verifying the logic is correct:



Checking if `getBankedAmount` should account for negative entries (from applying). Reviewing the banking logic more closely:



Fixing `getBankedAmount` to return the net banked amount (sum of all entries, not just positive) so it accounts for applications:


```typescript
// src/adapters/outbound/postgres/PrismaBankRepository.ts
import { prisma } from "../../../infrastructure/db/prisma.js";
import type { BankRepositoryPort } from "../../../core/ports/BankRepositoryPort.js";
import type { BankEntryEntity } from "../../../core/domain/BankEntryEntity.js";

export class PrismaBankRepository implements BankRepositoryPort {
  async getBankedAmount(shipId: string, year: number): Promise<number> {
    // Get all entries (both positive for banking and negative for applying)
    const entries = await prisma.bankEntry.findMany({
      where: { shipId, year },
    });
    // Sum all entries: positive entries (banking) - negative entries (applying)
    // This gives the net banked amount available
    return entries.reduce((sum, entry) => sum + entry.amountGco2eq, 0);
  }

  async getBankRecords(shipId: string, year: number): Promise<BankEntryEntity[]> {
    return prisma.bankEntry.findMany({
      where: { shipId, year },
    });
  }

  async bankSurplus(shipId: string, year: number, amount: number): Promise<BankEntryEntity> {
    if (amount <= 0) {
      throw new Error("Amount must be positive to bank surplus");
    }
    return prisma.bankEntry.create({
      data: {
        shipId,
        year,
        amountGco2eq: amount,
      },
    });
  }

  async applyBanked(shipId: string, year: number, amount: number): Promise<BankEntryEntity> {
    if (amount <= 0) {
      throw new Error("Amount must be positive to apply banked surplus");
    }
    // Create a negative entry to represent applying banked surplus
    return prisma.bankEntry.create({
      data: {
        shipId,
        year,
        amountGco2eq: -amount, // Negative to represent application
      },
    });
  }
}


```


Checking for lint errors and verifying the logic:



Updating comments to reflect that `getBankedAmount` now returns the net banked amount:


```typescript
// src/core/application/ApplyBanked.ts
import type { ComplianceRepositoryPort } from "../ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../ports/BankRepositoryPort.js";

/**
 * Apply banked surplus according to Article 20.
 * Applying banked surplus increases the current CB.
 */
export async function applyBanked(
  complianceRepo: ComplianceRepositoryPort,
  bankRepo: BankRepositoryPort,
  shipId: string,
  year: number,
  amount: number
) {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  // Get current base CB
  const cb = await complianceRepo.getCB(shipId, year);
  if (!cb) {
    throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
  }

  // Get available banked amount (net: positive entries - negative entries)
  const availableBanked = await bankRepo.getBankedAmount(shipId, year);
  if (amount > availableBanked) {
    throw new Error(
      `Cannot apply ${amount}: only ${availableBanked} available in bank`
    );
  }

  // Apply the banked amount (creates negative entry to reduce banked amount)
  await bankRepo.applyBanked(shipId, year, amount);

  // Calculate new CB after application (base CB + applied amount)
  const cbAfter = Math.round(cb.cbGco2eq + amount);

  // Update CB in database - applying banked increases CB
  await complianceRepo.upsertCB({
    shipId,
    year,
    cbGco2eq: cbAfter,
  });

  return {
    shipId,
    year,
    cbBefore: cb.cbGco2eq,
    applied: amount,
    cbAfter,
  };
}


```

```typescript
// src/core/application/GetAdjustedCB.ts
import type { ComplianceRepositoryPort } from "../ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../ports/BankRepositoryPort.js";

/**
 * Get adjusted CB according to Article 20.
 * Adjusted CB = Base CB + Available Banked Amount
 * This represents what the CB would be if all banked surplus was applied.
 * Used for pooling calculations (Article 21).
 */
export async function getAdjustedCB(
  complianceRepo: ComplianceRepositoryPort,
  bankRepo: BankRepositoryPort,
  shipId: string,
  year: number
) {
  // Get base CB (from routes calculation, not modified by banking)
  const baseCB = await complianceRepo.getCB(shipId, year);
  if (!baseCB) {
    throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
  }

  // Get available banked amount (net: positive entries - negative entries)
  // This is the net amount that can be applied (after accounting for previous applications)
  const bankedAmount = await bankRepo.getBankedAmount(shipId, year);

  // Adjusted CB = base CB + available banked amount
  // This is what CB would be if all banked surplus was applied
  const adjustedCB = baseCB.cbGco2eq + bankedAmount;

  return {
    shipId,
    year,
    cbBefore: baseCB.cbGco2eq,
    bankedAmount: Math.round(bankedAmount),
    cbAfter: Math.round(adjustedCB),
  };
}


```


Checking for lint errors:



## Summary

Fixed the banking surplus issue. The implementation allowed banking the same amount multiple times because it didn't account for already banked amounts.

### The Problem

1. Banking validation only checked if `amount <= baseCB`, not accounting for already banked amounts.
2. `getBankedAmount` only summed positive entries, ignoring negative entries from applying banked surplus.

**Example of the bug:**
- Base CB = 100
- Bank 100 → CB still 100, banked = 100
- Bank 100 again → CB still 100, banked = 200 (should fail)

### The Fix

1. Updated `BankSurplus.ts`:
   - Calculates available CB: `availableCB = baseCB - alreadyBanked`
   - Validates: `amount <= availableCB`
   - Prevents double-banking

2. Updated `PrismaBankRepository.ts`:
   - `getBankedAmount` now returns the net banked amount (sum of all entries: positive - negative)
   - Accounts for both banking (positive) and applying (negative) entries

3. Updated comments in `ApplyBanked.ts` and `GetAdjustedCB.ts` to reflect the net calculation.

### How It Works Now

According to FuelEU Article 20:
- Base CB is calculated from routes (never changes)
- Available CB for banking = Base CB - Net Banked Amount
- You can only bank what's available
- Net banked amount = Total banked (positive entries) - Total applied (negative entries)

**Example:**
- Base CB = 100
- Bank 60 → Available CB = 40, Net banked = 60
- Try to bank 50 → Fails (only 40 available)
- Apply 30 → Net banked = 30, Available CB = 70

This prevents double-banking and ensures the banked surplus cannot exceed the available surplus.

---

**User**

on teh frontend side could you make it some for banking tab that when you have to enter shipId it automatically selects the correct year for it or in the drop down box for shipId it lists all the valid ids from the db table stored and when you select a shipId it the year drop down lists the correct years for when it went on a tour 

---

**Cursor**


Reviewing the banking page and available API endpoints to add shipId and year dropdowns with proper filtering.



Checking the route entity structure to understand the data format:



Updating the banking page to add shipId and year dropdowns with proper filtering:


```typescriptreact
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";

interface BankRecord {
  id: number;
  shipId: string;
  year: number;
  amountGco2eq: number;
}

interface Route {
  id: number;
  routeId: string;
  year: number;
  vesselType: string;
  fuelType: string;
}

export default function BankingPage() {
  const [shipId, setShipId] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [cb, setCb] = useState<number | null>(null);
  const [adjustedCb, setAdjustedCb] = useState<number | null>(null);
  const [bankedAmount, setBankedAmount] = useState<number>(0);
  const [bankAmount, setBankAmount] = useState(""); // Amount to bank
  const [applyAmount, setApplyAmount] = useState("");
  const [bankRecords, setBankRecords] = useState<BankRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ship ID and year management
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [availableShipIds, setAvailableShipIds] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Auto-load data when shipId and year change (debounced)
  useEffect(() => {
    if (shipId && shipId.trim().length > 0 && year) {
      const timer = setTimeout(() => {
        void loadCompleteData();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setCb(null);
      setAdjustedCb(null);
      setBankedAmount(0);
      setBankRecords([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipId, year]);

  const loadCompleteData = async () => {
    if (!shipId || !year) return;
    
    try {
      setLoading(true);
      setError(null);

      const cbResult = await api.getCB(shipId, year);
      setCb(cbResult.cb ?? 0);

      const adjustedResult = await api.getAdjustedCB(shipId, year);
      setAdjustedCb(adjustedResult.cbAfter ?? 0);
      setBankedAmount(adjustedResult.bankedAmount ?? 0);

      const records = await api.getBankRecords(shipId, year);
      setBankRecords(records ?? []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load data";
      setError(errorMsg);
      
      setCb(null);
      setAdjustedCb(null);
      setBankedAmount(0);
      setBankRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBankSurplus = async () => {
    if (!shipId || !year) {
      toast.error("Please enter Ship ID and Year");
      return;
    }
    
    const amount = parseFloat(bankAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    if (cb === null || cb <= 0) {
      toast.error("No positive balance available to bank");
      return;
    }

    if (amount > cb) {
      toast.error(`Amount exceeds available surplus (${cb.toLocaleString()} gCO₂eq)`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await api.bankSurplus(shipId, year, amount);
      
      toast.success(`Successfully banked ${result.banked.toLocaleString()} gCO₂eq`);
      setBankAmount("");
      
      await loadCompleteData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to bank surplus";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const handleApplyBanked = async () => {
    if (!shipId || !year) {
      toast.error("Please enter Ship ID and Year");
      return;
    }
    
    const amount = parseFloat(applyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    
    if (amount > bankedAmount) {
      toast.error(`Amount exceeds available banked surplus (${bankedAmount.toLocaleString()} gCO₂eq)`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await api.applyBanked(shipId, year, amount);
      
      toast.success(`Successfully applied ${result.applied.toLocaleString()} gCO₂eq`);
      setApplyAmount("");
      
      await loadCompleteData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to apply banked surplus";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const totalBankedFromRecords = bankRecords.reduce((sum, record) => sum + (record.amountGco2eq ?? 0), 0);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-background pb-24">
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Banking Operations
          </h1>
          <p className="text-muted-foreground mt-2">
            Bank surplus or apply banked compliance balance (Article 20)
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Input Form */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Ship & Year Selection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Ship/Route ID
              </label>
              <input
                type="text"
                value={shipId}
                onChange={(e) => setShipId(e.target.value)}
                placeholder="Enter ship ID"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: R001, R002, etc.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || 2024)}
                placeholder="2024"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && !cb && (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-sm text-muted-foreground">Loading compliance data...</p>
          </div>
        )}

        {/* KPI Cards */}
        {cb !== null && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Base CB
                </span>
                <span className={`text-xs font-semibold ${cb > 0 ? 'text-green-600' : cb < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {cb > 0 ? 'Surplus' : cb < 0 ? 'Deficit' : 'Balanced'}
                </span>
              </div>
              <div className="text-2xl font-bold">
                {(cb ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">gCO₂eq (from routes)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Available Banked
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {(bankedAmount ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">gCO₂eq (can apply)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Adjusted CB
              </div>
              <div className="text-2xl font-bold">
                {adjustedCb !== null ? (adjustedCb ?? 0).toLocaleString() : '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Base CB + Banked (for pooling)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Total Banked
              </div>
              <div className="text-2xl font-bold">
                {totalBankedFromRecords.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">From All Years</div>
            </div>
          </div>
        )}

        {/* Banking Actions */}
        {cb !== null && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Surplus Action */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Bank Surplus</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Store surplus compliance balance for future use (Article 20). Banking does not modify your base CB.
              </p>
              
              {cb !== null && cb > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-green-50 border border-green-200">
                    <p className="text-sm text-green-800">
                      Base CB available: <span className="font-bold">{(cb ?? 0).toLocaleString()} gCO₂eq</span>
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      You can bank up to this amount
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Amount to Bank (gCO₂eq)
                    </label>
                    <input
                      type="number"
                      value={bankAmount}
                      onChange={(e) => setBankAmount(e.target.value)}
                      placeholder="Enter amount"
                      disabled={loading}
                      max={cb}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>
                  
                  <button
                    onClick={handleBankSurplus}
                    disabled={loading || !bankAmount || parseFloat(bankAmount) <= 0}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Banking..." : "Bank Surplus"}
                  </button>
                  
                  <p className="text-xs text-muted-foreground">
                    Note: Base CB remains unchanged. Banked amount is stored for future application.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted border border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    {cb === 0 ? 'No surplus available to bank' : 'Cannot bank: Balance is in deficit'}
                  </p>
                </div>
              )}
            </div>

            {/* Apply Banked Action */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Apply Banked</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Apply previously banked surplus to increase your compliance balance (Article 20).
              </p>
              
              {bankedAmount !== null && bankedAmount > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-800">
                      Available: <span className="font-bold">{(bankedAmount ?? 0).toLocaleString()} gCO₂eq</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Amount to Apply (gCO₂eq)
                    </label>
                    <input
                      type="number"
                      value={applyAmount}
                      onChange={(e) => setApplyAmount(e.target.value)}
                      placeholder="Enter amount"
                      disabled={loading}
                      max={bankedAmount}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>
                  
                  <button
                    onClick={handleApplyBanked}
                    disabled={loading || !applyAmount || parseFloat(applyAmount) <= 0}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Applying..." : "Apply Banked"}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted border border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    No banked surplus available to apply
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bank Records */}
        {shipId && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Bank Records History</h2>
              <p className="text-sm text-muted-foreground mt-1">
                All banking transactions for {shipId}
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Record ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ship ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount (gCO₂eq)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                          <span className="text-sm">Loading records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        <p className="text-sm">No bank records found for this ship</p>
                        <p className="text-xs mt-1">Bank surplus to create records</p>
                      </td>
                    </tr>
                  ) : (
                    bankRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">
                          #{record.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {record.shipId}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {record.year}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right">
                          {(record.amountGco2eq ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

```

```typescriptreact
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";

interface BankRecord {
  id: number;
  shipId: string;
  year: number;
  amountGco2eq: number;
}

interface Route {
  id: number;
  routeId: string;
  year: number;
  vesselType: string;
  fuelType: string;
}

export default function BankingPage() {
  const [shipId, setShipId] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [cb, setCb] = useState<number | null>(null);
  const [adjustedCb, setAdjustedCb] = useState<number | null>(null);
  const [bankedAmount, setBankedAmount] = useState<number>(0);
  const [bankAmount, setBankAmount] = useState(""); // Amount to bank
  const [applyAmount, setApplyAmount] = useState("");
  const [bankRecords, setBankRecords] = useState<BankRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ship ID and year management
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [availableShipIds, setAvailableShipIds] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Load all routes on mount to get ship IDs and years
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoadingRoutes(true);
        const routes = await api.getRoutes();
        setAllRoutes(routes);
        
        // Extract unique ship IDs (routeId values)
        const uniqueShipIds = [...new Set(routes.map((r: Route) => r.routeId))].sort();
        setAvailableShipIds(uniqueShipIds);
      } catch (err) {
        console.error("Failed to load routes:", err);
        toast.error("Failed to load ship data");
      } finally {
        setLoadingRoutes(false);
      }
    };
    
    void loadRoutes();
  }, []);

  // Update available years when shipId changes
  useEffect(() => {
    if (shipId) {
      const yearsForShip = allRoutes
        .filter((r) => r.routeId === shipId)
        .map((r) => r.year)
        .filter((y, i, arr) => arr.indexOf(y) === i) // Get unique years
        .sort((a, b) => b - a); // Sort descending (most recent first)
      
      setAvailableYears(yearsForShip);
      
      // Auto-select the most recent year when shipId is selected
      if (yearsForShip.length > 0 && (!year || !yearsForShip.includes(year))) {
        setYear(yearsForShip[0]);
      }
    } else {
      setAvailableYears([]);
      setYear(null);
    }
  }, [shipId, allRoutes]);

  // Auto-load data when shipId and year change (debounced)
  useEffect(() => {
    if (shipId && shipId.trim().length > 0 && year) {
      const timer = setTimeout(() => {
        void loadCompleteData();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setCb(null);
      setAdjustedCb(null);
      setBankedAmount(0);
      setBankRecords([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipId, year]);

  const loadCompleteData = async () => {
    if (!shipId || !year) return;
    
    try {
      setLoading(true);
      setError(null);

      const cbResult = await api.getCB(shipId, year);
      setCb(cbResult.cb ?? 0);

      const adjustedResult = await api.getAdjustedCB(shipId, year);
      setAdjustedCb(adjustedResult.cbAfter ?? 0);
      setBankedAmount(adjustedResult.bankedAmount ?? 0);

      const records = await api.getBankRecords(shipId, year);
      setBankRecords(records ?? []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load data";
      setError(errorMsg);
      
      setCb(null);
      setAdjustedCb(null);
      setBankedAmount(0);
      setBankRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBankSurplus = async () => {
    if (!shipId || !year) {
      toast.error("Please enter Ship ID and Year");
      return;
    }
    
    const amount = parseFloat(bankAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    if (cb === null || cb <= 0) {
      toast.error("No positive balance available to bank");
      return;
    }

    if (amount > cb) {
      toast.error(`Amount exceeds available surplus (${cb.toLocaleString()} gCO₂eq)`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await api.bankSurplus(shipId, year, amount);
      
      toast.success(`Successfully banked ${result.banked.toLocaleString()} gCO₂eq`);
      setBankAmount("");
      
      await loadCompleteData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to bank surplus";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const handleApplyBanked = async () => {
    if (!shipId || !year) {
      toast.error("Please enter Ship ID and Year");
      return;
    }
    
    const amount = parseFloat(applyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    
    if (amount > bankedAmount) {
      toast.error(`Amount exceeds available banked surplus (${bankedAmount.toLocaleString()} gCO₂eq)`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await api.applyBanked(shipId, year, amount);
      
      toast.success(`Successfully applied ${result.applied.toLocaleString()} gCO₂eq`);
      setApplyAmount("");
      
      await loadCompleteData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to apply banked surplus";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const totalBankedFromRecords = bankRecords.reduce((sum, record) => sum + (record.amountGco2eq ?? 0), 0);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-background pb-24">
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Banking Operations
          </h1>
          <p className="text-muted-foreground mt-2">
            Bank surplus or apply banked compliance balance (Article 20)
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Input Form */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Ship & Year Selection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Ship/Route ID
              </label>
              <input
                type="text"
                value={shipId}
                onChange={(e) => setShipId(e.target.value)}
                placeholder="Enter ship ID"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: R001, R002, etc.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || 2024)}
                placeholder="2024"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && !cb && (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-sm text-muted-foreground">Loading compliance data...</p>
          </div>
        )}

        {/* KPI Cards */}
        {cb !== null && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Base CB
                </span>
                <span className={`text-xs font-semibold ${cb > 0 ? 'text-green-600' : cb < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {cb > 0 ? 'Surplus' : cb < 0 ? 'Deficit' : 'Balanced'}
                </span>
              </div>
              <div className="text-2xl font-bold">
                {(cb ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">gCO₂eq (from routes)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Available Banked
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {(bankedAmount ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">gCO₂eq (can apply)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Adjusted CB
              </div>
              <div className="text-2xl font-bold">
                {adjustedCb !== null ? (adjustedCb ?? 0).toLocaleString() : '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Base CB + Banked (for pooling)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Total Banked
              </div>
              <div className="text-2xl font-bold">
                {totalBankedFromRecords.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">From All Years</div>
            </div>
          </div>
        )}

        {/* Banking Actions */}
        {cb !== null && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Surplus Action */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Bank Surplus</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Store surplus compliance balance for future use (Article 20). Banking does not modify your base CB.
              </p>
              
              {cb !== null && cb > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-green-50 border border-green-200">
                    <p className="text-sm text-green-800">
                      Base CB available: <span className="font-bold">{(cb ?? 0).toLocaleString()} gCO₂eq</span>
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      You can bank up to this amount
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Amount to Bank (gCO₂eq)
                    </label>
                    <input
                      type="number"
                      value={bankAmount}
                      onChange={(e) => setBankAmount(e.target.value)}
                      placeholder="Enter amount"
                      disabled={loading}
                      max={cb}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>
                  
                  <button
                    onClick={handleBankSurplus}
                    disabled={loading || !bankAmount || parseFloat(bankAmount) <= 0}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Banking..." : "Bank Surplus"}
                  </button>
                  
                  <p className="text-xs text-muted-foreground">
                    Note: Base CB remains unchanged. Banked amount is stored for future application.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted border border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    {cb === 0 ? 'No surplus available to bank' : 'Cannot bank: Balance is in deficit'}
                  </p>
                </div>
              )}
            </div>

            {/* Apply Banked Action */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Apply Banked</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Apply previously banked surplus to increase your compliance balance (Article 20).
              </p>
              
              {bankedAmount !== null && bankedAmount > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-800">
                      Available: <span className="font-bold">{(bankedAmount ?? 0).toLocaleString()} gCO₂eq</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Amount to Apply (gCO₂eq)
                    </label>
                    <input
                      type="number"
                      value={applyAmount}
                      onChange={(e) => setApplyAmount(e.target.value)}
                      placeholder="Enter amount"
                      disabled={loading}
                      max={bankedAmount}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>
                  
                  <button
                    onClick={handleApplyBanked}
                    disabled={loading || !applyAmount || parseFloat(applyAmount) <= 0}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Applying..." : "Apply Banked"}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted border border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    No banked surplus available to apply
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bank Records */}
        {shipId && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Bank Records History</h2>
              <p className="text-sm text-muted-foreground mt-1">
                All banking transactions for {shipId}
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Record ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ship ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount (gCO₂eq)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                          <span className="text-sm">Loading records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        <p className="text-sm">No bank records found for this ship</p>
                        <p className="text-xs mt-1">Bank surplus to create records</p>
                      </td>
                    </tr>
                  ) : (
                    bankRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">
                          #{record.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {record.shipId}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {record.year}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right">
                          {(record.amountGco2eq ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

```

```typescriptreact
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";

interface BankRecord {
  id: number;
  shipId: string;
  year: number;
  amountGco2eq: number;
}

interface Route {
  id: number;
  routeId: string;
  year: number;
  vesselType: string;
  fuelType: string;
}

export default function BankingPage() {
  const [shipId, setShipId] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [cb, setCb] = useState<number | null>(null);
  const [adjustedCb, setAdjustedCb] = useState<number | null>(null);
  const [bankedAmount, setBankedAmount] = useState<number>(0);
  const [bankAmount, setBankAmount] = useState(""); // Amount to bank
  const [applyAmount, setApplyAmount] = useState("");
  const [bankRecords, setBankRecords] = useState<BankRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ship ID and year management
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [availableShipIds, setAvailableShipIds] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Load all routes on mount to get ship IDs and years
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoadingRoutes(true);
        const routes = await api.getRoutes();
        setAllRoutes(routes);
        
        // Extract unique ship IDs (routeId values)
        const uniqueShipIds = [...new Set(routes.map((r: Route) => r.routeId))].sort();
        setAvailableShipIds(uniqueShipIds);
      } catch (err) {
        console.error("Failed to load routes:", err);
        toast.error("Failed to load ship data");
      } finally {
        setLoadingRoutes(false);
      }
    };
    
    void loadRoutes();
  }, []);

  // Update available years when shipId changes
  useEffect(() => {
    if (shipId) {
      const yearsForShip = allRoutes
        .filter((r) => r.routeId === shipId)
        .map((r) => r.year)
        .filter((y, i, arr) => arr.indexOf(y) === i) // Get unique years
        .sort((a, b) => b - a); // Sort descending (most recent first)
      
      setAvailableYears(yearsForShip);
      
      // Auto-select the most recent year when shipId is selected
      if (yearsForShip.length > 0 && (!year || !yearsForShip.includes(year))) {
        setYear(yearsForShip[0]);
      }
    } else {
      setAvailableYears([]);
      setYear(null);
    }
  }, [shipId, allRoutes]);

  // Auto-load data when shipId and year change (debounced)
  useEffect(() => {
    if (shipId && shipId.trim().length > 0 && year) {
      const timer = setTimeout(() => {
        void loadCompleteData();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setCb(null);
      setAdjustedCb(null);
      setBankedAmount(0);
      setBankRecords([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipId, year]);

  const loadCompleteData = async () => {
    if (!shipId || !year) return;
    
    try {
      setLoading(true);
      setError(null);

      const cbResult = await api.getCB(shipId, year);
      setCb(cbResult.cb ?? 0);

      const adjustedResult = await api.getAdjustedCB(shipId, year);
      setAdjustedCb(adjustedResult.cbAfter ?? 0);
      setBankedAmount(adjustedResult.bankedAmount ?? 0);

      const records = await api.getBankRecords(shipId, year);
      setBankRecords(records ?? []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load data";
      setError(errorMsg);
      
      setCb(null);
      setAdjustedCb(null);
      setBankedAmount(0);
      setBankRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBankSurplus = async () => {
    if (!shipId || !year) {
      toast.error("Please enter Ship ID and Year");
      return;
    }
    
    const amount = parseFloat(bankAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    if (cb === null || cb <= 0) {
      toast.error("No positive balance available to bank");
      return;
    }

    if (amount > cb) {
      toast.error(`Amount exceeds available surplus (${cb.toLocaleString()} gCO₂eq)`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await api.bankSurplus(shipId, year, amount);
      
      toast.success(`Successfully banked ${result.banked.toLocaleString()} gCO₂eq`);
      setBankAmount("");
      
      await loadCompleteData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to bank surplus";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const handleApplyBanked = async () => {
    if (!shipId || !year) {
      toast.error("Please enter Ship ID and Year");
      return;
    }
    
    const amount = parseFloat(applyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    
    if (amount > bankedAmount) {
      toast.error(`Amount exceeds available banked surplus (${bankedAmount.toLocaleString()} gCO₂eq)`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await api.applyBanked(shipId, year, amount);
      
      toast.success(`Successfully applied ${result.applied.toLocaleString()} gCO₂eq`);
      setApplyAmount("");
      
      await loadCompleteData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to apply banked surplus";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const totalBankedFromRecords = bankRecords.reduce((sum, record) => sum + (record.amountGco2eq ?? 0), 0);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-background pb-24">
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Banking Operations
          </h1>
          <p className="text-muted-foreground mt-2">
            Bank surplus or apply banked compliance balance (Article 20)
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Input Form */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Ship & Year Selection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Ship/Route ID
              </label>
              {loadingRoutes ? (
                <div className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                  Loading ships...
                </div>
              ) : (
                <select
                  value={shipId}
                  onChange={(e) => setShipId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select a ship...</option>
                  {availableShipIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {availableShipIds.length > 0 
                  ? `${availableShipIds.length} ship(s) available`
                  : "No ships found"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Year
              </label>
              <select
                value={year || ""}
                onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : null)}
                disabled={!shipId || availableYears.length === 0}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{shipId ? "Select a year..." : "Select ship first"}</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {shipId && availableYears.length > 0
                  ? `${availableYears.length} year(s) available for ${shipId}`
                  : shipId
                  ? "No years found for this ship"
                  : "Select a ship to see available years"}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && !cb && (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-sm text-muted-foreground">Loading compliance data...</p>
          </div>
        )}

        {/* KPI Cards */}
        {cb !== null && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Base CB
                </span>
                <span className={`text-xs font-semibold ${cb > 0 ? 'text-green-600' : cb < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {cb > 0 ? 'Surplus' : cb < 0 ? 'Deficit' : 'Balanced'}
                </span>
              </div>
              <div className="text-2xl font-bold">
                {(cb ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">gCO₂eq (from routes)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Available Banked
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {(bankedAmount ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">gCO₂eq (can apply)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Adjusted CB
              </div>
              <div className="text-2xl font-bold">
                {adjustedCb !== null ? (adjustedCb ?? 0).toLocaleString() : '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Base CB + Banked (for pooling)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Total Banked
              </div>
              <div className="text-2xl font-bold">
                {totalBankedFromRecords.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">From All Years</div>
            </div>
          </div>
        )}

        {/* Banking Actions */}
        {cb !== null && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Surplus Action */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Bank Surplus</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Store surplus compliance balance for future use (Article 20). Banking does not modify your base CB.
              </p>
              
              {cb !== null && cb > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-green-50 border border-green-200">
                    <p className="text-sm text-green-800">
                      Base CB available: <span className="font-bold">{(cb ?? 0).toLocaleString()} gCO₂eq</span>
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      You can bank up to this amount
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Amount to Bank (gCO₂eq)
                    </label>
                    <input
                      type="number"
                      value={bankAmount}
                      onChange={(e) => setBankAmount(e.target.value)}
                      placeholder="Enter amount"
                      disabled={loading}
                      max={cb}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>
                  
                  <button
                    onClick={handleBankSurplus}
                    disabled={loading || !bankAmount || parseFloat(bankAmount) <= 0}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Banking..." : "Bank Surplus"}
                  </button>
                  
                  <p className="text-xs text-muted-foreground">
                    Note: Base CB remains unchanged. Banked amount is stored for future application.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted border border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    {cb === 0 ? 'No surplus available to bank' : 'Cannot bank: Balance is in deficit'}
                  </p>
                </div>
              )}
            </div>

            {/* Apply Banked Action */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Apply Banked</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Apply previously banked surplus to increase your compliance balance (Article 20).
              </p>
              
              {bankedAmount !== null && bankedAmount > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-800">
                      Available: <span className="font-bold">{(bankedAmount ?? 0).toLocaleString()} gCO₂eq</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Amount to Apply (gCO₂eq)
                    </label>
                    <input
                      type="number"
                      value={applyAmount}
                      onChange={(e) => setApplyAmount(e.target.value)}
                      placeholder="Enter amount"
                      disabled={loading}
                      max={bankedAmount}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>
                  
                  <button
                    onClick={handleApplyBanked}
                    disabled={loading || !applyAmount || parseFloat(applyAmount) <= 0}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Applying..." : "Apply Banked"}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted border border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    No banked surplus available to apply
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bank Records */}
        {shipId && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Bank Records History</h2>
              <p className="text-sm text-muted-foreground mt-1">
                All banking transactions for {shipId}
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Record ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ship ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount (gCO₂eq)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                          <span className="text-sm">Loading records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        <p className="text-sm">No bank records found for this ship</p>
                        <p className="text-xs mt-1">Bank surplus to create records</p>
                      </td>
                    </tr>
                  ) : (
                    bankRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">
                          #{record.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {record.shipId}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {record.year}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right">
                          {(record.amountGco2eq ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

```


Fixing the useEffect dependency issue:


```typescriptreact
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";

interface BankRecord {
  id: number;
  shipId: string;
  year: number;
  amountGco2eq: number;
}

interface Route {
  id: number;
  routeId: string;
  year: number;
  vesselType: string;
  fuelType: string;
}

export default function BankingPage() {
  const [shipId, setShipId] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [cb, setCb] = useState<number | null>(null);
  const [adjustedCb, setAdjustedCb] = useState<number | null>(null);
  const [bankedAmount, setBankedAmount] = useState<number>(0);
  const [bankAmount, setBankAmount] = useState(""); // Amount to bank
  const [applyAmount, setApplyAmount] = useState("");
  const [bankRecords, setBankRecords] = useState<BankRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ship ID and year management
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [availableShipIds, setAvailableShipIds] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Load all routes on mount to get ship IDs and years
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoadingRoutes(true);
        const routes = await api.getRoutes();
        setAllRoutes(routes);
        
        // Extract unique ship IDs (routeId values)
        const uniqueShipIds = [...new Set(routes.map((r: Route) => r.routeId))].sort();
        setAvailableShipIds(uniqueShipIds);
      } catch (err) {
        console.error("Failed to load routes:", err);
        toast.error("Failed to load ship data");
      } finally {
        setLoadingRoutes(false);
      }
    };
    
    void loadRoutes();
  }, []);

  // Update available years when shipId changes
  useEffect(() => {
    if (shipId) {
      const yearsForShip = allRoutes
        .filter((r) => r.routeId === shipId)
        .map((r) => r.year)
        .filter((y, i, arr) => arr.indexOf(y) === i) // Get unique years
        .sort((a, b) => b - a); // Sort descending (most recent first)
      
      setAvailableYears(yearsForShip);
      
      // Auto-select the most recent year when shipId is selected
      if (yearsForShip.length > 0 && (!year || !yearsForShip.includes(year))) {
        setYear(yearsForShip[0]);
      }
    } else {
      setAvailableYears([]);
      setYear(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipId, allRoutes]);

  // Auto-load data when shipId and year change (debounced)
  useEffect(() => {
    if (shipId && shipId.trim().length > 0 && year) {
      const timer = setTimeout(() => {
        void loadCompleteData();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setCb(null);
      setAdjustedCb(null);
      setBankedAmount(0);
      setBankRecords([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipId, year]);

  const loadCompleteData = async () => {
    if (!shipId || !year) return;
    
    try {
      setLoading(true);
      setError(null);

      const cbResult = await api.getCB(shipId, year);
      setCb(cbResult.cb ?? 0);

      const adjustedResult = await api.getAdjustedCB(shipId, year);
      setAdjustedCb(adjustedResult.cbAfter ?? 0);
      setBankedAmount(adjustedResult.bankedAmount ?? 0);

      const records = await api.getBankRecords(shipId, year);
      setBankRecords(records ?? []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load data";
      setError(errorMsg);
      
      setCb(null);
      setAdjustedCb(null);
      setBankedAmount(0);
      setBankRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBankSurplus = async () => {
    if (!shipId || !year) {
      toast.error("Please enter Ship ID and Year");
      return;
    }
    
    const amount = parseFloat(bankAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    if (cb === null || cb <= 0) {
      toast.error("No positive balance available to bank");
      return;
    }

    if (amount > cb) {
      toast.error(`Amount exceeds available surplus (${cb.toLocaleString()} gCO₂eq)`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await api.bankSurplus(shipId, year, amount);
      
      toast.success(`Successfully banked ${result.banked.toLocaleString()} gCO₂eq`);
      setBankAmount("");
      
      await loadCompleteData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to bank surplus";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const handleApplyBanked = async () => {
    if (!shipId || !year) {
      toast.error("Please enter Ship ID and Year");
      return;
    }
    
    const amount = parseFloat(applyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    
    if (amount > bankedAmount) {
      toast.error(`Amount exceeds available banked surplus (${bankedAmount.toLocaleString()} gCO₂eq)`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await api.applyBanked(shipId, year, amount);
      
      toast.success(`Successfully applied ${result.applied.toLocaleString()} gCO₂eq`);
      setApplyAmount("");
      
      await loadCompleteData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to apply banked surplus";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const totalBankedFromRecords = bankRecords.reduce((sum, record) => sum + (record.amountGco2eq ?? 0), 0);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-background pb-24">
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Banking Operations
          </h1>
          <p className="text-muted-foreground mt-2">
            Bank surplus or apply banked compliance balance (Article 20)
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Input Form */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Ship & Year Selection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Ship/Route ID
              </label>
              {loadingRoutes ? (
                <div className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                  Loading ships...
                </div>
              ) : (
                <select
                  value={shipId}
                  onChange={(e) => setShipId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select a ship...</option>
                  {availableShipIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {availableShipIds.length > 0 
                  ? `${availableShipIds.length} ship(s) available`
                  : "No ships found"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Year
              </label>
              <select
                value={year || ""}
                onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : null)}
                disabled={!shipId || availableYears.length === 0}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{shipId ? "Select a year..." : "Select ship first"}</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {shipId && availableYears.length > 0
                  ? `${availableYears.length} year(s) available for ${shipId}`
                  : shipId
                  ? "No years found for this ship"
                  : "Select a ship to see available years"}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && !cb && (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-sm text-muted-foreground">Loading compliance data...</p>
          </div>
        )}

        {/* KPI Cards */}
        {cb !== null && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Base CB
                </span>
                <span className={`text-xs font-semibold ${cb > 0 ? 'text-green-600' : cb < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {cb > 0 ? 'Surplus' : cb < 0 ? 'Deficit' : 'Balanced'}
                </span>
              </div>
              <div className="text-2xl font-bold">
                {(cb ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">gCO₂eq (from routes)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Available Banked
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {(bankedAmount ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">gCO₂eq (can apply)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Adjusted CB
              </div>
              <div className="text-2xl font-bold">
                {adjustedCb !== null ? (adjustedCb ?? 0).toLocaleString() : '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Base CB + Banked (for pooling)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Total Banked
              </div>
              <div className="text-2xl font-bold">
                {totalBankedFromRecords.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">From All Years</div>
            </div>
          </div>
        )}

        {/* Banking Actions */}
        {cb !== null && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Surplus Action */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Bank Surplus</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Store surplus compliance balance for future use (Article 20). Banking does not modify your base CB.
              </p>
              
              {cb !== null && cb > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-green-50 border border-green-200">
                    <p className="text-sm text-green-800">
                      Base CB available: <span className="font-bold">{(cb ?? 0).toLocaleString()} gCO₂eq</span>
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      You can bank up to this amount
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Amount to Bank (gCO₂eq)
                    </label>
                    <input
                      type="number"
                      value={bankAmount}
                      onChange={(e) => setBankAmount(e.target.value)}
                      placeholder="Enter amount"
                      disabled={loading}
                      max={cb}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>
                  
                  <button
                    onClick={handleBankSurplus}
                    disabled={loading || !bankAmount || parseFloat(bankAmount) <= 0}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Banking..." : "Bank Surplus"}
                  </button>
                  
                  <p className="text-xs text-muted-foreground">
                    Note: Base CB remains unchanged. Banked amount is stored for future application.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted border border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    {cb === 0 ? 'No surplus available to bank' : 'Cannot bank: Balance is in deficit'}
                  </p>
                </div>
              )}
            </div>

            {/* Apply Banked Action */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Apply Banked</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Apply previously banked surplus to increase your compliance balance (Article 20).
              </p>
              
              {bankedAmount !== null && bankedAmount > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-800">
                      Available: <span className="font-bold">{(bankedAmount ?? 0).toLocaleString()} gCO₂eq</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Amount to Apply (gCO₂eq)
                    </label>
                    <input
                      type="number"
                      value={applyAmount}
                      onChange={(e) => setApplyAmount(e.target.value)}
                      placeholder="Enter amount"
                      disabled={loading}
                      max={bankedAmount}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>
                  
                  <button
                    onClick={handleApplyBanked}
                    disabled={loading || !applyAmount || parseFloat(applyAmount) <= 0}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Applying..." : "Apply Banked"}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted border border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    No banked surplus available to apply
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bank Records */}
        {shipId && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Bank Records History</h2>
              <p className="text-sm text-muted-foreground mt-1">
                All banking transactions for {shipId}
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Record ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ship ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount (gCO₂eq)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                          <span className="text-sm">Loading records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        <p className="text-sm">No bank records found for this ship</p>
                        <p className="text-xs mt-1">Bank surplus to create records</p>
                      </td>
                    </tr>
                  ) : (
                    bankRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">
                          #{record.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {record.shipId}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {record.year}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right">
                          {(record.amountGco2eq ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

```


Updating the todos and verifying the implementation:



Verifying the implementation is complete. Summary of changes:

## Summary

Updated the banking tab to use dropdowns for ship ID and year selection.

### Changes Made:

1. **Ship ID dropdown**: Replaced the text input with a dropdown populated from routes in the database
   - Fetches all routes on component mount
   - Extracts unique ship IDs (routeId values)
   - Displays them in a sorted dropdown

2. **Year dropdown**: Replaced the number input with a dropdown that filters based on the selected ship ID
   - When a ship ID is selected, shows only years when that ship has routes
   - Years are sorted descending (most recent first)
   - Disabled until a ship ID is selected

3. **Auto-selection**: When a ship ID is selected, the most recent year is automatically selected

4. **User experience improvements**:
   - Loading state while fetching routes
   - Helpful messages showing available ships/years
   - Clear feedback when no data is available

### How It Works:

1. On page load: Fetches all routes from `/routes` endpoint
2. Ship selection: User selects a ship ID from the dropdown
3. Year filtering: Years dropdown updates to show only years for the selected ship
4. Auto-select: Most recent year is automatically selected
5. Data loading: Compliance data loads automatically when both ship ID and year are selected

The implementation ensures users can only select valid ship IDs and years that exist in the database, preventing errors from invalid combinations.

---

**User**

no the shipId is like 1,2,4 what you have given now is route Id so fix it

---

**Cursor**


Updating to use the numeric route `id` as `shipId` instead of `routeId`. Checking the backend to confirm the mapping:



Updating to use the numeric route `id` (1, 2, 4) as `shipId` instead of `routeId`:


```typescriptreact
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";

interface BankRecord {
  id: number;
  shipId: string;
  year: number;
  amountGco2eq: number;
}

interface Route {
  id: number;
  routeId: string;
  year: number;
  vesselType: string;
  fuelType: string;
}

export default function BankingPage() {
  const [shipId, setShipId] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [cb, setCb] = useState<number | null>(null);
  const [adjustedCb, setAdjustedCb] = useState<number | null>(null);
  const [bankedAmount, setBankedAmount] = useState<number>(0);
  const [bankAmount, setBankAmount] = useState(""); // Amount to bank
  const [applyAmount, setApplyAmount] = useState("");
  const [bankRecords, setBankRecords] = useState<BankRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ship ID and year management
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [availableShipIds, setAvailableShipIds] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Load all routes on mount to get ship IDs and years
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoadingRoutes(true);
        const routes = await api.getRoutes();
        setAllRoutes(routes);
        
        // Extract unique ship IDs (route id values, not routeId string)
        // shipId is the numeric route.id (1, 2, 4, etc.)
        const uniqueShipIds = [...new Set(routes.map((r: Route) => r.id.toString()))].sort((a, b) => parseInt(a) - parseInt(b));
        setAvailableShipIds(uniqueShipIds);
      } catch (err) {
        console.error("Failed to load routes:", err);
        toast.error("Failed to load ship data");
      } finally {
        setLoadingRoutes(false);
      }
    };
    
    void loadRoutes();
  }, []);

  // Update available years when shipId changes
  useEffect(() => {
    if (shipId) {
      const shipIdNum = parseInt(shipId);
      const yearsForShip = allRoutes
        .filter((r) => r.id === shipIdNum)
        .map((r) => r.year)
        .filter((y, i, arr) => arr.indexOf(y) === i) // Get unique years
        .sort((a, b) => b - a); // Sort descending (most recent first)
      
      setAvailableYears(yearsForShip);
      
      // Auto-select the most recent year when shipId is selected
      if (yearsForShip.length > 0 && (!year || !yearsForShip.includes(year))) {
        setYear(yearsForShip[0]);
      }
    } else {
      setAvailableYears([]);
      setYear(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipId, allRoutes]);

  // Auto-load data when shipId and year change (debounced)
  useEffect(() => {
    if (shipId && shipId.trim().length > 0 && year) {
      const timer = setTimeout(() => {
        void loadCompleteData();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setCb(null);
      setAdjustedCb(null);
      setBankedAmount(0);
      setBankRecords([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipId, year]);

  const loadCompleteData = async () => {
    if (!shipId || !year) return;
    
    try {
      setLoading(true);
      setError(null);

      const cbResult = await api.getCB(shipId, year);
      setCb(cbResult.cb ?? 0);

      const adjustedResult = await api.getAdjustedCB(shipId, year);
      setAdjustedCb(adjustedResult.cbAfter ?? 0);
      setBankedAmount(adjustedResult.bankedAmount ?? 0);

      const records = await api.getBankRecords(shipId, year);
      setBankRecords(records ?? []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load data";
      setError(errorMsg);
      
      setCb(null);
      setAdjustedCb(null);
      setBankedAmount(0);
      setBankRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBankSurplus = async () => {
    if (!shipId || !year) {
      toast.error("Please enter Ship ID and Year");
      return;
    }
    
    const amount = parseFloat(bankAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    if (cb === null || cb <= 0) {
      toast.error("No positive balance available to bank");
      return;
    }

    if (amount > cb) {
      toast.error(`Amount exceeds available surplus (${cb.toLocaleString()} gCO₂eq)`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await api.bankSurplus(shipId, year, amount);
      
      toast.success(`Successfully banked ${result.banked.toLocaleString()} gCO₂eq`);
      setBankAmount("");
      
      await loadCompleteData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to bank surplus";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const handleApplyBanked = async () => {
    if (!shipId || !year) {
      toast.error("Please enter Ship ID and Year");
      return;
    }
    
    const amount = parseFloat(applyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    
    if (amount > bankedAmount) {
      toast.error(`Amount exceeds available banked surplus (${bankedAmount.toLocaleString()} gCO₂eq)`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await api.applyBanked(shipId, year, amount);
      
      toast.success(`Successfully applied ${result.applied.toLocaleString()} gCO₂eq`);
      setApplyAmount("");
      
      await loadCompleteData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to apply banked surplus";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const totalBankedFromRecords = bankRecords.reduce((sum, record) => sum + (record.amountGco2eq ?? 0), 0);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-background pb-24">
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Banking Operations
          </h1>
          <p className="text-muted-foreground mt-2">
            Bank surplus or apply banked compliance balance (Article 20)
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Input Form */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Ship & Year Selection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Ship/Route ID
              </label>
              {loadingRoutes ? (
                <div className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                  Loading ships...
                </div>
              ) : (
                <select
                  value={shipId}
                  onChange={(e) => setShipId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select a ship...</option>
                  {availableShipIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {availableShipIds.length > 0 
                  ? `${availableShipIds.length} ship(s) available`
                  : "No ships found"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Year
              </label>
              <select
                value={year || ""}
                onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : null)}
                disabled={!shipId || availableYears.length === 0}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{shipId ? "Select a year..." : "Select ship first"}</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {shipId && availableYears.length > 0
                  ? `${availableYears.length} year(s) available for ${shipId}`
                  : shipId
                  ? "No years found for this ship"
                  : "Select a ship to see available years"}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && !cb && (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-sm text-muted-foreground">Loading compliance data...</p>
          </div>
        )}

        {/* KPI Cards */}
        {cb !== null && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Base CB
                </span>
                <span className={`text-xs font-semibold ${cb > 0 ? 'text-green-600' : cb < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {cb > 0 ? 'Surplus' : cb < 0 ? 'Deficit' : 'Balanced'}
                </span>
              </div>
              <div className="text-2xl font-bold">
                {(cb ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">gCO₂eq (from routes)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Available Banked
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {(bankedAmount ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">gCO₂eq (can apply)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Adjusted CB
              </div>
              <div className="text-2xl font-bold">
                {adjustedCb !== null ? (adjustedCb ?? 0).toLocaleString() : '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Base CB + Banked (for pooling)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Total Banked
              </div>
              <div className="text-2xl font-bold">
                {totalBankedFromRecords.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">From All Years</div>
            </div>
          </div>
        )}

        {/* Banking Actions */}
        {cb !== null && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Surplus Action */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Bank Surplus</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Store surplus compliance balance for future use (Article 20). Banking does not modify your base CB.
              </p>
              
              {cb !== null && cb > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-green-50 border border-green-200">
                    <p className="text-sm text-green-800">
                      Base CB available: <span className="font-bold">{(cb ?? 0).toLocaleString()} gCO₂eq</span>
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      You can bank up to this amount
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Amount to Bank (gCO₂eq)
                    </label>
                    <input
                      type="number"
                      value={bankAmount}
                      onChange={(e) => setBankAmount(e.target.value)}
                      placeholder="Enter amount"
                      disabled={loading}
                      max={cb}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>
                  
                  <button
                    onClick={handleBankSurplus}
                    disabled={loading || !bankAmount || parseFloat(bankAmount) <= 0}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Banking..." : "Bank Surplus"}
                  </button>
                  
                  <p className="text-xs text-muted-foreground">
                    Note: Base CB remains unchanged. Banked amount is stored for future application.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted border border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    {cb === 0 ? 'No surplus available to bank' : 'Cannot bank: Balance is in deficit'}
                  </p>
                </div>
              )}
            </div>

            {/* Apply Banked Action */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Apply Banked</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Apply previously banked surplus to increase your compliance balance (Article 20).
              </p>
              
              {bankedAmount !== null && bankedAmount > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-800">
                      Available: <span className="font-bold">{(bankedAmount ?? 0).toLocaleString()} gCO₂eq</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Amount to Apply (gCO₂eq)
                    </label>
                    <input
                      type="number"
                      value={applyAmount}
                      onChange={(e) => setApplyAmount(e.target.value)}
                      placeholder="Enter amount"
                      disabled={loading}
                      max={bankedAmount}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>
                  
                  <button
                    onClick={handleApplyBanked}
                    disabled={loading || !applyAmount || parseFloat(applyAmount) <= 0}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Applying..." : "Apply Banked"}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted border border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    No banked surplus available to apply
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bank Records */}
        {shipId && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Bank Records History</h2>
              <p className="text-sm text-muted-foreground mt-1">
                All banking transactions for {shipId}
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Record ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ship ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount (gCO₂eq)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                          <span className="text-sm">Loading records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        <p className="text-sm">No bank records found for this ship</p>
                        <p className="text-xs mt-1">Bank surplus to create records</p>
                      </td>
                    </tr>
                  ) : (
                    bankRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">
                          #{record.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {record.shipId}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {record.year}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right">
                          {(record.amountGco2eq ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

```

```typescriptreact
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";

interface BankRecord {
  id: number;
  shipId: string;
  year: number;
  amountGco2eq: number;
}

interface Route {
  id: number;
  routeId: string;
  year: number;
  vesselType: string;
  fuelType: string;
}

export default function BankingPage() {
  const [shipId, setShipId] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [cb, setCb] = useState<number | null>(null);
  const [adjustedCb, setAdjustedCb] = useState<number | null>(null);
  const [bankedAmount, setBankedAmount] = useState<number>(0);
  const [bankAmount, setBankAmount] = useState(""); // Amount to bank
  const [applyAmount, setApplyAmount] = useState("");
  const [bankRecords, setBankRecords] = useState<BankRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ship ID and year management
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [availableShipIds, setAvailableShipIds] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Load all routes on mount to get ship IDs and years
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoadingRoutes(true);
        const routes = await api.getRoutes();
        setAllRoutes(routes);
        
        // Extract unique ship IDs (route id values, not routeId string)
        // shipId is the numeric route.id (1, 2, 4, etc.)
        const uniqueShipIds = [...new Set(routes.map((r: Route) => r.id.toString()))].sort((a, b) => parseInt(a) - parseInt(b));
        setAvailableShipIds(uniqueShipIds);
      } catch (err) {
        console.error("Failed to load routes:", err);
        toast.error("Failed to load ship data");
      } finally {
        setLoadingRoutes(false);
      }
    };
    
    void loadRoutes();
  }, []);

  // Update available years when shipId changes
  useEffect(() => {
    if (shipId) {
      const shipIdNum = parseInt(shipId);
      const yearsForShip = allRoutes
        .filter((r) => r.id === shipIdNum)
        .map((r) => r.year)
        .filter((y, i, arr) => arr.indexOf(y) === i) // Get unique years
        .sort((a, b) => b - a); // Sort descending (most recent first)
      
      setAvailableYears(yearsForShip);
      
      // Auto-select the most recent year when shipId is selected
      if (yearsForShip.length > 0 && (!year || !yearsForShip.includes(year))) {
        setYear(yearsForShip[0]);
      }
    } else {
      setAvailableYears([]);
      setYear(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipId, allRoutes]);

  // Auto-load data when shipId and year change (debounced)
  useEffect(() => {
    if (shipId && shipId.trim().length > 0 && year) {
      const timer = setTimeout(() => {
        void loadCompleteData();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setCb(null);
      setAdjustedCb(null);
      setBankedAmount(0);
      setBankRecords([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipId, year]);

  const loadCompleteData = async () => {
    if (!shipId || !year) return;
    
    try {
      setLoading(true);
      setError(null);

      const cbResult = await api.getCB(shipId, year);
      setCb(cbResult.cb ?? 0);

      const adjustedResult = await api.getAdjustedCB(shipId, year);
      setAdjustedCb(adjustedResult.cbAfter ?? 0);
      setBankedAmount(adjustedResult.bankedAmount ?? 0);

      const records = await api.getBankRecords(shipId, year);
      setBankRecords(records ?? []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load data";
      setError(errorMsg);
      
      setCb(null);
      setAdjustedCb(null);
      setBankedAmount(0);
      setBankRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBankSurplus = async () => {
    if (!shipId || !year) {
      toast.error("Please enter Ship ID and Year");
      return;
    }
    
    const amount = parseFloat(bankAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    if (cb === null || cb <= 0) {
      toast.error("No positive balance available to bank");
      return;
    }

    if (amount > cb) {
      toast.error(`Amount exceeds available surplus (${cb.toLocaleString()} gCO₂eq)`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await api.bankSurplus(shipId, year, amount);
      
      toast.success(`Successfully banked ${result.banked.toLocaleString()} gCO₂eq`);
      setBankAmount("");
      
      await loadCompleteData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to bank surplus";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const handleApplyBanked = async () => {
    if (!shipId || !year) {
      toast.error("Please enter Ship ID and Year");
      return;
    }
    
    const amount = parseFloat(applyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    
    if (amount > bankedAmount) {
      toast.error(`Amount exceeds available banked surplus (${bankedAmount.toLocaleString()} gCO₂eq)`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await api.applyBanked(shipId, year, amount);
      
      toast.success(`Successfully applied ${result.applied.toLocaleString()} gCO₂eq`);
      setApplyAmount("");
      
      await loadCompleteData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to apply banked surplus";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const totalBankedFromRecords = bankRecords.reduce((sum, record) => sum + (record.amountGco2eq ?? 0), 0);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-background pb-24">
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Banking Operations
          </h1>
          <p className="text-muted-foreground mt-2">
            Bank surplus or apply banked compliance balance (Article 20)
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Input Form */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Ship & Year Selection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Ship ID
              </label>
              {loadingRoutes ? (
                <div className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                  Loading ships...
                </div>
              ) : (
                <select
                  value={shipId}
                  onChange={(e) => setShipId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select a ship...</option>
                  {availableShipIds.map((id) => {
                    const route = allRoutes.find((r) => r.id === parseInt(id));
                    return (
                      <option key={id} value={id}>
                        {id} {route ? `(${route.routeId})` : ''}
                      </option>
                    );
                  })}
                </select>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {availableShipIds.length > 0 
                  ? `${availableShipIds.length} ship(s) available`
                  : "No ships found"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Year
              </label>
              <select
                value={year || ""}
                onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : null)}
                disabled={!shipId || availableYears.length === 0}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{shipId ? "Select a year..." : "Select ship first"}</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {shipId && availableYears.length > 0
                  ? `${availableYears.length} year(s) available for ${shipId}`
                  : shipId
                  ? "No years found for this ship"
                  : "Select a ship to see available years"}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && !cb && (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-sm text-muted-foreground">Loading compliance data...</p>
          </div>
        )}

        {/* KPI Cards */}
        {cb !== null && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Base CB
                </span>
                <span className={`text-xs font-semibold ${cb > 0 ? 'text-green-600' : cb < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {cb > 0 ? 'Surplus' : cb < 0 ? 'Deficit' : 'Balanced'}
                </span>
              </div>
              <div className="text-2xl font-bold">
                {(cb ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">gCO₂eq (from routes)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Available Banked
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {(bankedAmount ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">gCO₂eq (can apply)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Adjusted CB
              </div>
              <div className="text-2xl font-bold">
                {adjustedCb !== null ? (adjustedCb ?? 0).toLocaleString() : '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Base CB + Banked (for pooling)</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Total Banked
              </div>
              <div className="text-2xl font-bold">
                {totalBankedFromRecords.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">From All Years</div>
            </div>
          </div>
        )}

        {/* Banking Actions */}
        {cb !== null && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Surplus Action */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Bank Surplus</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Store surplus compliance balance for future use (Article 20). Banking does not modify your base CB.
              </p>
              
              {cb !== null && cb > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-green-50 border border-green-200">
                    <p className="text-sm text-green-800">
                      Base CB available: <span className="font-bold">{(cb ?? 0).toLocaleString()} gCO₂eq</span>
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      You can bank up to this amount
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Amount to Bank (gCO₂eq)
                    </label>
                    <input
                      type="number"
                      value={bankAmount}
                      onChange={(e) => setBankAmount(e.target.value)}
                      placeholder="Enter amount"
                      disabled={loading}
                      max={cb}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>
                  
                  <button
                    onClick={handleBankSurplus}
                    disabled={loading || !bankAmount || parseFloat(bankAmount) <= 0}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Banking..." : "Bank Surplus"}
                  </button>
                  
                  <p className="text-xs text-muted-foreground">
                    Note: Base CB remains unchanged. Banked amount is stored for future application.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted border border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    {cb === 0 ? 'No surplus available to bank' : 'Cannot bank: Balance is in deficit'}
                  </p>
                </div>
              )}
            </div>

            {/* Apply Banked Action */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Apply Banked</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Apply previously banked surplus to increase your compliance balance (Article 20).
              </p>
              
              {bankedAmount !== null && bankedAmount > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-800">
                      Available: <span className="font-bold">{(bankedAmount ?? 0).toLocaleString()} gCO₂eq</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Amount to Apply (gCO₂eq)
                    </label>
                    <input
                      type="number"
                      value={applyAmount}
                      onChange={(e) => setApplyAmount(e.target.value)}
                      placeholder="Enter amount"
                      disabled={loading}
                      max={bankedAmount}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>
                  
                  <button
                    onClick={handleApplyBanked}
                    disabled={loading || !applyAmount || parseFloat(applyAmount) <= 0}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Applying..." : "Apply Banked"}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted border border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    No banked surplus available to apply
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bank Records */}
        {shipId && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Bank Records History</h2>
              <p className="text-sm text-muted-foreground mt-1">
                All banking transactions for {shipId}
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Record ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ship ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount (gCO₂eq)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                          <span className="text-sm">Loading records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        <p className="text-sm">No bank records found for this ship</p>
                        <p className="text-xs mt-1">Bank surplus to create records</p>
                      </td>
                    </tr>
                  ) : (
                    bankRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">
                          #{record.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {record.shipId}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {record.year}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right">
                          {(record.amountGco2eq ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

```


Updated to use the numeric route `id` (1, 2, 4, etc.) as `shipId` instead of the `routeId` string.

## Changes Made:

1. **Ship ID extraction**: Now extracts unique route `id` values (numeric) instead of `routeId` strings
2. **Year filtering**: Filters routes by `r.id === shipIdNum` instead of `r.routeId === shipId`
3. **Dropdown display**: Shows the numeric ID (1, 2, 4, etc.) with the routeId in parentheses for reference (e.g., "1 (R001)")

The dropdown now shows:
- `1 (R001)`
- `2 (R002)`
- `4 (R004)`
- etc.

The selected value is the numeric ID (1, 2, 4), which matches what the backend expects in `ComputeCB.ts` where it filters by `r.id === Number(shipId)`.

---

**User**

when i click o set baseline disable interactivtion blur the background and disable a loaded untile the promise is resolved and i get a output

---

**Cursor**


Adding a loading state for "Set Baseline": disable interaction, blur the background, and show a loading indicator until the promise resolves. Finding where "Set Baseline" is implemented:



Adding a loading state for "Set Baseline": disable interactions, blur the background, and show a loading indicator until the promise resolves.


```typescriptreact
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { IconInfoCircle, IconRoute, IconFilter, IconFilterOff } from "@tabler/icons-react";

interface Route {
  id: number;
  routeId: string;
  year: number;
  vesselType: string;
  fuelType: string;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  ghgIntensity: number;
  isBaseline: boolean;
}

export default function RoutesPage() {
  const [allRoutes, setAllRoutes] = useState<Route[]>([]); // Store all routes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }>({});

  const [vesselTypes, setVesselTypes] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [settingBaseline, setSettingBaseline] = useState<number | null>(null); // Track which route is being set as baseline

  // Load all routes once on mount
  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRoutes(); // Fetch all routes without filters

      setAllRoutes(data);

      // Extract unique values for filters
      const uniqueVesselTypes = [...new Set(data.map((r: Route) => r.vesselType))].sort();
      const uniqueFuelTypes = [...new Set(data.map((r: Route) => r.fuelType))].sort();
      const uniqueYears = [...new Set(data.map((r: Route) => r.year))].sort((a, b) => b - a);

      setVesselTypes(uniqueVesselTypes);
      setFuelTypes(uniqueFuelTypes);
      setYears(uniqueYears);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load routes";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Load routes once on mount
  useEffect(() => {
    void loadRoutes();
  }, []);

  // Filter routes on the client side (instant, no API calls)
  const filteredRoutes = allRoutes.filter((route) => {
    if (filters.vesselType && route.vesselType !== filters.vesselType) return false;
    if (filters.fuelType && route.fuelType !== filters.fuelType) return false;
    if (filters.year && route.year !== filters.year) return false;
    return true;
  });

  const handleSetBaseline = async (routeId: number) => {
    try {
      await api.setBaseline(routeId);
      toast.success("Baseline updated successfully");
      
      // Optimistic update: Update local state immediately
      setAllRoutes(prevRoutes => 
        prevRoutes.map(r => ({
          ...r,
          isBaseline: r.id === routeId
        }))
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to set baseline";
      toast.error(errorMsg);
      // Revert on error
      await loadRoutes();
    }
  };

  if (loading && allRoutes.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = filters.vesselType || filters.fuelType || filters.year;

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
          <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <IconRoute className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Routes Management</h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    View and manage all shipping routes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{filteredRoutes.length}</span>
                <span>{filteredRoutes.length === allRoutes.length ? 'routes' : `of ${allRoutes.length} routes`}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconFilter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Filters</span>
                  {hasActiveFilters && (
                    <span className="text-xs text-gray-500">({filteredRoutes.length} results)</span>
                  )}
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white rounded-lg border border-gray-300 hover:border-gray-400 transition-all"
                  >
                    <IconFilterOff className="w-3.5 h-3.5" />
                    Clear Filters
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Vessel Type
                  </label>
                  <select
                    value={filters.vesselType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, vesselType: e.target.value === "" ? undefined : e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Vessel Types</option>
                    {vesselTypes.map((vt) => (
                      <option key={vt} value={vt}>
                        {vt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Fuel Type
                  </label>
                  <select
                    value={filters.fuelType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, fuelType: e.target.value === "" ? undefined : e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Fuel Types</option>
                    {fuelTypes.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Year
                  </label>
                  <select
                    value={filters.year ?? ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        year: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Years</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ship ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Route ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Vessel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      GHG Intensity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Consumption
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Emissions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <IconFilter className="w-12 h-12 text-gray-300" />
                          <p className="text-sm font-medium">No routes found</p>
                          <p className="text-xs">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes.map((route) => (
                    <tr
                      key={route.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        route.isBaseline ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{route.routeId}</span>
                          {route.isBaseline && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Baseline
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.vesselType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {route.ghgIntensity.toFixed(2)} <span className="text-xs text-gray-500">gCO₂e/MJ</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelConsumption.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.distance.toLocaleString()} <span className="text-xs text-gray-500">km</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.totalEmissions.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!route.isBaseline && (
                          <button
                            onClick={() => handleSetBaseline(route.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
                          >
                            Set Baseline
                          </button>
                        )}
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}

```

```typescriptreact
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { IconInfoCircle, IconRoute, IconFilter, IconFilterOff } from "@tabler/icons-react";

interface Route {
  id: number;
  routeId: string;
  year: number;
  vesselType: string;
  fuelType: string;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  ghgIntensity: number;
  isBaseline: boolean;
}

export default function RoutesPage() {
  const [allRoutes, setAllRoutes] = useState<Route[]>([]); // Store all routes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }>({});

  const [vesselTypes, setVesselTypes] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [settingBaseline, setSettingBaseline] = useState<number | null>(null); // Track which route is being set as baseline

  // Load all routes once on mount
  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRoutes(); // Fetch all routes without filters

      setAllRoutes(data);

      // Extract unique values for filters
      const uniqueVesselTypes = [...new Set(data.map((r: Route) => r.vesselType))].sort();
      const uniqueFuelTypes = [...new Set(data.map((r: Route) => r.fuelType))].sort();
      const uniqueYears = [...new Set(data.map((r: Route) => r.year))].sort((a, b) => b - a);

      setVesselTypes(uniqueVesselTypes);
      setFuelTypes(uniqueFuelTypes);
      setYears(uniqueYears);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load routes";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Load routes once on mount
  useEffect(() => {
    void loadRoutes();
  }, []);

  // Filter routes on the client side (instant, no API calls)
  const filteredRoutes = allRoutes.filter((route) => {
    if (filters.vesselType && route.vesselType !== filters.vesselType) return false;
    if (filters.fuelType && route.fuelType !== filters.fuelType) return false;
    if (filters.year && route.year !== filters.year) return false;
    return true;
  });

  const handleSetBaseline = async (routeId: number) => {
    try {
      setSettingBaseline(routeId); // Start loading state
      const result = await api.setBaseline(routeId);
      toast.success(result.message || "Baseline updated successfully");
      
      // Optimistic update: Update local state immediately
      setAllRoutes(prevRoutes => 
        prevRoutes.map(r => ({
          ...r,
          isBaseline: r.id === routeId
        }))
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to set baseline";
      toast.error(errorMsg);
      // Revert on error
      await loadRoutes();
    } finally {
      setSettingBaseline(null); // Clear loading state
    }
  };

  if (loading && allRoutes.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = filters.vesselType || filters.fuelType || filters.year;

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
          <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <IconRoute className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Routes Management</h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    View and manage all shipping routes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{filteredRoutes.length}</span>
                <span>{filteredRoutes.length === allRoutes.length ? 'routes' : `of ${allRoutes.length} routes`}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconFilter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Filters</span>
                  {hasActiveFilters && (
                    <span className="text-xs text-gray-500">({filteredRoutes.length} results)</span>
                  )}
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white rounded-lg border border-gray-300 hover:border-gray-400 transition-all"
                  >
                    <IconFilterOff className="w-3.5 h-3.5" />
                    Clear Filters
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Vessel Type
                  </label>
                  <select
                    value={filters.vesselType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, vesselType: e.target.value === "" ? undefined : e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Vessel Types</option>
                    {vesselTypes.map((vt) => (
                      <option key={vt} value={vt}>
                        {vt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Fuel Type
                  </label>
                  <select
                    value={filters.fuelType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, fuelType: e.target.value === "" ? undefined : e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Fuel Types</option>
                    {fuelTypes.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Year
                  </label>
                  <select
                    value={filters.year ?? ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        year: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Years</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ship ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Route ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Vessel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      GHG Intensity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Consumption
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Emissions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <IconFilter className="w-12 h-12 text-gray-300" />
                          <p className="text-sm font-medium">No routes found</p>
                          <p className="text-xs">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes.map((route) => (
                    <tr
                      key={route.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        route.isBaseline ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{route.routeId}</span>
                          {route.isBaseline && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Baseline
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.vesselType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {route.ghgIntensity.toFixed(2)} <span className="text-xs text-gray-500">gCO₂e/MJ</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelConsumption.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.distance.toLocaleString()} <span className="text-xs text-gray-500">km</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.totalEmissions.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!route.isBaseline && (
                          <button
                            onClick={() => handleSetBaseline(route.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
                          >
                            Set Baseline
                          </button>
                        )}
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}

```

```typescriptreact
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { IconInfoCircle, IconRoute, IconFilter, IconFilterOff } from "@tabler/icons-react";

interface Route {
  id: number;
  routeId: string;
  year: number;
  vesselType: string;
  fuelType: string;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  ghgIntensity: number;
  isBaseline: boolean;
}

export default function RoutesPage() {
  const [allRoutes, setAllRoutes] = useState<Route[]>([]); // Store all routes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }>({});

  const [vesselTypes, setVesselTypes] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [settingBaseline, setSettingBaseline] = useState<number | null>(null); // Track which route is being set as baseline

  // Load all routes once on mount
  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRoutes(); // Fetch all routes without filters

      setAllRoutes(data);

      // Extract unique values for filters
      const uniqueVesselTypes = [...new Set(data.map((r: Route) => r.vesselType))].sort();
      const uniqueFuelTypes = [...new Set(data.map((r: Route) => r.fuelType))].sort();
      const uniqueYears = [...new Set(data.map((r: Route) => r.year))].sort((a, b) => b - a);

      setVesselTypes(uniqueVesselTypes);
      setFuelTypes(uniqueFuelTypes);
      setYears(uniqueYears);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load routes";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Load routes once on mount
  useEffect(() => {
    void loadRoutes();
  }, []);

  // Filter routes on the client side (instant, no API calls)
  const filteredRoutes = allRoutes.filter((route) => {
    if (filters.vesselType && route.vesselType !== filters.vesselType) return false;
    if (filters.fuelType && route.fuelType !== filters.fuelType) return false;
    if (filters.year && route.year !== filters.year) return false;
    return true;
  });

  const handleSetBaseline = async (routeId: number) => {
    try {
      setSettingBaseline(routeId); // Start loading state
      const result = await api.setBaseline(routeId);
      toast.success(result.message || "Baseline updated successfully");
      
      // Optimistic update: Update local state immediately
      setAllRoutes(prevRoutes => 
        prevRoutes.map(r => ({
          ...r,
          isBaseline: r.id === routeId
        }))
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to set baseline";
      toast.error(errorMsg);
      // Revert on error
      await loadRoutes();
    } finally {
      setSettingBaseline(null); // Clear loading state
    }
  };

  if (loading && allRoutes.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = filters.vesselType || filters.fuelType || filters.year;

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <TooltipProvider>
        <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 relative ${settingBaseline !== null ? 'overflow-hidden' : ''}`}>
          {/* Loading Overlay */}
          {settingBaseline !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[280px]">
                <div className="relative">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">Setting Baseline</p>
                  <p className="text-sm text-gray-600 mt-1">Please wait...</p>
                </div>
              </div>
            </div>
          )}
          <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <IconRoute className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Routes Management</h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    View and manage all shipping routes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{filteredRoutes.length}</span>
                <span>{filteredRoutes.length === allRoutes.length ? 'routes' : `of ${allRoutes.length} routes`}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconFilter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Filters</span>
                  {hasActiveFilters && (
                    <span className="text-xs text-gray-500">({filteredRoutes.length} results)</span>
                  )}
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white rounded-lg border border-gray-300 hover:border-gray-400 transition-all"
                  >
                    <IconFilterOff className="w-3.5 h-3.5" />
                    Clear Filters
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Vessel Type
                  </label>
                  <select
                    value={filters.vesselType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, vesselType: e.target.value === "" ? undefined : e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Vessel Types</option>
                    {vesselTypes.map((vt) => (
                      <option key={vt} value={vt}>
                        {vt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Fuel Type
                  </label>
                  <select
                    value={filters.fuelType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, fuelType: e.target.value === "" ? undefined : e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Fuel Types</option>
                    {fuelTypes.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Year
                  </label>
                  <select
                    value={filters.year ?? ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        year: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Years</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ship ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Route ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Vessel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      GHG Intensity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Consumption
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Emissions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <IconFilter className="w-12 h-12 text-gray-300" />
                          <p className="text-sm font-medium">No routes found</p>
                          <p className="text-xs">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes.map((route) => (
                    <tr
                      key={route.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        route.isBaseline ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{route.routeId}</span>
                          {route.isBaseline && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Baseline
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.vesselType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {route.ghgIntensity.toFixed(2)} <span className="text-xs text-gray-500">gCO₂e/MJ</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelConsumption.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.distance.toLocaleString()} <span className="text-xs text-gray-500">km</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.totalEmissions.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!route.isBaseline && (
                          <button
                            onClick={() => handleSetBaseline(route.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
                          >
                            Set Baseline
                          </button>
                        )}
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}

```

```typescriptreact
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { IconInfoCircle, IconRoute, IconFilter, IconFilterOff } from "@tabler/icons-react";

interface Route {
  id: number;
  routeId: string;
  year: number;
  vesselType: string;
  fuelType: string;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  ghgIntensity: number;
  isBaseline: boolean;
}

export default function RoutesPage() {
  const [allRoutes, setAllRoutes] = useState<Route[]>([]); // Store all routes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }>({});

  const [vesselTypes, setVesselTypes] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [settingBaseline, setSettingBaseline] = useState<number | null>(null); // Track which route is being set as baseline

  // Load all routes once on mount
  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRoutes(); // Fetch all routes without filters

      setAllRoutes(data);

      // Extract unique values for filters
      const uniqueVesselTypes = [...new Set(data.map((r: Route) => r.vesselType))].sort();
      const uniqueFuelTypes = [...new Set(data.map((r: Route) => r.fuelType))].sort();
      const uniqueYears = [...new Set(data.map((r: Route) => r.year))].sort((a, b) => b - a);

      setVesselTypes(uniqueVesselTypes);
      setFuelTypes(uniqueFuelTypes);
      setYears(uniqueYears);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load routes";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Load routes once on mount
  useEffect(() => {
    void loadRoutes();
  }, []);

  // Filter routes on the client side (instant, no API calls)
  const filteredRoutes = allRoutes.filter((route) => {
    if (filters.vesselType && route.vesselType !== filters.vesselType) return false;
    if (filters.fuelType && route.fuelType !== filters.fuelType) return false;
    if (filters.year && route.year !== filters.year) return false;
    return true;
  });

  const handleSetBaseline = async (routeId: number) => {
    try {
      setSettingBaseline(routeId); // Start loading state
      const result = await api.setBaseline(routeId);
      toast.success(result.message || "Baseline updated successfully");
      
      // Optimistic update: Update local state immediately
      setAllRoutes(prevRoutes => 
        prevRoutes.map(r => ({
          ...r,
          isBaseline: r.id === routeId
        }))
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to set baseline";
      toast.error(errorMsg);
      // Revert on error
      await loadRoutes();
    } finally {
      setSettingBaseline(null); // Clear loading state
    }
  };

  if (loading && allRoutes.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = filters.vesselType || filters.fuelType || filters.year;

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <TooltipProvider>
        <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 relative ${settingBaseline !== null ? 'overflow-hidden' : ''}`}>
          {/* Loading Overlay */}
          {settingBaseline !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[280px]">
                <div className="relative">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">Setting Baseline</p>
                  <p className="text-sm text-gray-600 mt-1">Please wait...</p>
                </div>
              </div>
            </div>
          )}
          <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <IconRoute className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Routes Management</h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    View and manage all shipping routes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{filteredRoutes.length}</span>
                <span>{filteredRoutes.length === allRoutes.length ? 'routes' : `of ${allRoutes.length} routes`}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconFilter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Filters</span>
                  {hasActiveFilters && (
                    <span className="text-xs text-gray-500">({filteredRoutes.length} results)</span>
                  )}
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white rounded-lg border border-gray-300 hover:border-gray-400 transition-all"
                  >
                    <IconFilterOff className="w-3.5 h-3.5" />
                    Clear Filters
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Vessel Type
                  </label>
                  <select
                    value={filters.vesselType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, vesselType: e.target.value === "" ? undefined : e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Vessel Types</option>
                    {vesselTypes.map((vt) => (
                      <option key={vt} value={vt}>
                        {vt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Fuel Type
                  </label>
                  <select
                    value={filters.fuelType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, fuelType: e.target.value === "" ? undefined : e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Fuel Types</option>
                    {fuelTypes.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Year
                  </label>
                  <select
                    value={filters.year ?? ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        year: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Years</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ship ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Route ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Vessel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      GHG Intensity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Consumption
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Emissions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <IconFilter className="w-12 h-12 text-gray-300" />
                          <p className="text-sm font-medium">No routes found</p>
                          <p className="text-xs">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes.map((route) => (
                    <tr
                      key={route.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        route.isBaseline ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{route.routeId}</span>
                          {route.isBaseline && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Baseline
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.vesselType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {route.ghgIntensity.toFixed(2)} <span className="text-xs text-gray-500">gCO₂e/MJ</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelConsumption.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.distance.toLocaleString()} <span className="text-xs text-gray-500">km</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.totalEmissions.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!route.isBaseline && (
                          <button
                            onClick={() => handleSetBaseline(route.id)}
                            disabled={settingBaseline !== null}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                          >
                            {settingBaseline === route.id ? (
                              <span className="flex items-center gap-2">
                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
                                Setting...
                              </span>
                            ) : (
                              "Set Baseline"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}

```


Disabling filters and other interactive elements during loading:


```typescriptreact
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { IconInfoCircle, IconRoute, IconFilter, IconFilterOff } from "@tabler/icons-react";

interface Route {
  id: number;
  routeId: string;
  year: number;
  vesselType: string;
  fuelType: string;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  ghgIntensity: number;
  isBaseline: boolean;
}

export default function RoutesPage() {
  const [allRoutes, setAllRoutes] = useState<Route[]>([]); // Store all routes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }>({});

  const [vesselTypes, setVesselTypes] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [settingBaseline, setSettingBaseline] = useState<number | null>(null); // Track which route is being set as baseline

  // Load all routes once on mount
  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRoutes(); // Fetch all routes without filters

      setAllRoutes(data);

      // Extract unique values for filters
      const uniqueVesselTypes = [...new Set(data.map((r: Route) => r.vesselType))].sort();
      const uniqueFuelTypes = [...new Set(data.map((r: Route) => r.fuelType))].sort();
      const uniqueYears = [...new Set(data.map((r: Route) => r.year))].sort((a, b) => b - a);

      setVesselTypes(uniqueVesselTypes);
      setFuelTypes(uniqueFuelTypes);
      setYears(uniqueYears);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load routes";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Load routes once on mount
  useEffect(() => {
    void loadRoutes();
  }, []);

  // Filter routes on the client side (instant, no API calls)
  const filteredRoutes = allRoutes.filter((route) => {
    if (filters.vesselType && route.vesselType !== filters.vesselType) return false;
    if (filters.fuelType && route.fuelType !== filters.fuelType) return false;
    if (filters.year && route.year !== filters.year) return false;
    return true;
  });

  const handleSetBaseline = async (routeId: number) => {
    try {
      setSettingBaseline(routeId); // Start loading state
      const result = await api.setBaseline(routeId);
      toast.success(result.message || "Baseline updated successfully");
      
      // Optimistic update: Update local state immediately
      setAllRoutes(prevRoutes => 
        prevRoutes.map(r => ({
          ...r,
          isBaseline: r.id === routeId
        }))
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to set baseline";
      toast.error(errorMsg);
      // Revert on error
      await loadRoutes();
    } finally {
      setSettingBaseline(null); // Clear loading state
    }
  };

  if (loading && allRoutes.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = filters.vesselType || filters.fuelType || filters.year;

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <TooltipProvider>
        <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 relative ${settingBaseline !== null ? 'overflow-hidden' : ''}`}>
          {/* Loading Overlay */}
          {settingBaseline !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[280px]">
                <div className="relative">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">Setting Baseline</p>
                  <p className="text-sm text-gray-600 mt-1">Please wait...</p>
                </div>
              </div>
            </div>
          )}
          <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <IconRoute className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Routes Management</h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    View and manage all shipping routes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{filteredRoutes.length}</span>
                <span>{filteredRoutes.length === allRoutes.length ? 'routes' : `of ${allRoutes.length} routes`}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconFilter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Filters</span>
                  {hasActiveFilters && (
                    <span className="text-xs text-gray-500">({filteredRoutes.length} results)</span>
                  )}
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    disabled={settingBaseline !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white rounded-lg border border-gray-300 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IconFilterOff className="w-3.5 h-3.5" />
                    Clear Filters
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Vessel Type
                  </label>
                  <select
                    value={filters.vesselType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, vesselType: e.target.value === "" ? undefined : e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Vessel Types</option>
                    {vesselTypes.map((vt) => (
                      <option key={vt} value={vt}>
                        {vt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Fuel Type
                  </label>
                  <select
                    value={filters.fuelType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, fuelType: e.target.value === "" ? undefined : e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Fuel Types</option>
                    {fuelTypes.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Year
                  </label>
                  <select
                    value={filters.year ?? ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        year: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Years</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ship ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Route ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Vessel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      GHG Intensity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Consumption
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Emissions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <IconFilter className="w-12 h-12 text-gray-300" />
                          <p className="text-sm font-medium">No routes found</p>
                          <p className="text-xs">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes.map((route) => (
                    <tr
                      key={route.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        route.isBaseline ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{route.routeId}</span>
                          {route.isBaseline && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Baseline
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.vesselType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {route.ghgIntensity.toFixed(2)} <span className="text-xs text-gray-500">gCO₂e/MJ</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelConsumption.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.distance.toLocaleString()} <span className="text-xs text-gray-500">km</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.totalEmissions.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!route.isBaseline && (
                          <button
                            onClick={() => handleSetBaseline(route.id)}
                            disabled={settingBaseline !== null}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                          >
                            {settingBaseline === route.id ? (
                              <span className="flex items-center gap-2">
                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
                                Setting...
                              </span>
                            ) : (
                              "Set Baseline"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}

```

```typescriptreact
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { IconInfoCircle, IconRoute, IconFilter, IconFilterOff } from "@tabler/icons-react";

interface Route {
  id: number;
  routeId: string;
  year: number;
  vesselType: string;
  fuelType: string;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  ghgIntensity: number;
  isBaseline: boolean;
}

export default function RoutesPage() {
  const [allRoutes, setAllRoutes] = useState<Route[]>([]); // Store all routes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }>({});

  const [vesselTypes, setVesselTypes] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [settingBaseline, setSettingBaseline] = useState<number | null>(null); // Track which route is being set as baseline

  // Load all routes once on mount
  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRoutes(); // Fetch all routes without filters

      setAllRoutes(data);

      // Extract unique values for filters
      const uniqueVesselTypes = [...new Set(data.map((r: Route) => r.vesselType))].sort();
      const uniqueFuelTypes = [...new Set(data.map((r: Route) => r.fuelType))].sort();
      const uniqueYears = [...new Set(data.map((r: Route) => r.year))].sort((a, b) => b - a);

      setVesselTypes(uniqueVesselTypes);
      setFuelTypes(uniqueFuelTypes);
      setYears(uniqueYears);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load routes";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Load routes once on mount
  useEffect(() => {
    void loadRoutes();
  }, []);

  // Filter routes on the client side (instant, no API calls)
  const filteredRoutes = allRoutes.filter((route) => {
    if (filters.vesselType && route.vesselType !== filters.vesselType) return false;
    if (filters.fuelType && route.fuelType !== filters.fuelType) return false;
    if (filters.year && route.year !== filters.year) return false;
    return true;
  });

  const handleSetBaseline = async (routeId: number) => {
    try {
      setSettingBaseline(routeId); // Start loading state
      const result = await api.setBaseline(routeId);
      toast.success(result.message || "Baseline updated successfully");
      
      // Optimistic update: Update local state immediately
      setAllRoutes(prevRoutes => 
        prevRoutes.map(r => ({
          ...r,
          isBaseline: r.id === routeId
        }))
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to set baseline";
      toast.error(errorMsg);
      // Revert on error
      await loadRoutes();
    } finally {
      setSettingBaseline(null); // Clear loading state
    }
  };

  if (loading && allRoutes.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = filters.vesselType || filters.fuelType || filters.year;

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <TooltipProvider>
        <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 relative ${settingBaseline !== null ? 'overflow-hidden' : ''}`}>
          {/* Loading Overlay */}
          {settingBaseline !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[280px]">
                <div className="relative">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">Setting Baseline</p>
                  <p className="text-sm text-gray-600 mt-1">Please wait...</p>
                </div>
              </div>
            </div>
          )}
          <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <IconRoute className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Routes Management</h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    View and manage all shipping routes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{filteredRoutes.length}</span>
                <span>{filteredRoutes.length === allRoutes.length ? 'routes' : `of ${allRoutes.length} routes`}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconFilter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Filters</span>
                  {hasActiveFilters && (
                    <span className="text-xs text-gray-500">({filteredRoutes.length} results)</span>
                  )}
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    disabled={settingBaseline !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white rounded-lg border border-gray-300 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IconFilterOff className="w-3.5 h-3.5" />
                    Clear Filters
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Vessel Type
                  </label>
                  <select
                    value={filters.vesselType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, vesselType: e.target.value === "" ? undefined : e.target.value })
                    }
                    disabled={settingBaseline !== null}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">All Vessel Types</option>
                    {vesselTypes.map((vt) => (
                      <option key={vt} value={vt}>
                        {vt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Fuel Type
                  </label>
                  <select
                    value={filters.fuelType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, fuelType: e.target.value === "" ? undefined : e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Fuel Types</option>
                    {fuelTypes.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Year
                  </label>
                  <select
                    value={filters.year ?? ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        year: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Years</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ship ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Route ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Vessel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      GHG Intensity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Consumption
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Emissions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <IconFilter className="w-12 h-12 text-gray-300" />
                          <p className="text-sm font-medium">No routes found</p>
                          <p className="text-xs">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes.map((route) => (
                    <tr
                      key={route.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        route.isBaseline ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{route.routeId}</span>
                          {route.isBaseline && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Baseline
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.vesselType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {route.ghgIntensity.toFixed(2)} <span className="text-xs text-gray-500">gCO₂e/MJ</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelConsumption.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.distance.toLocaleString()} <span className="text-xs text-gray-500">km</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.totalEmissions.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!route.isBaseline && (
                          <button
                            onClick={() => handleSetBaseline(route.id)}
                            disabled={settingBaseline !== null}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                          >
                            {settingBaseline === route.id ? (
                              <span className="flex items-center gap-2">
                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
                                Setting...
                              </span>
                            ) : (
                              "Set Baseline"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}

```

```typescriptreact
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { IconInfoCircle, IconRoute, IconFilter, IconFilterOff } from "@tabler/icons-react";

interface Route {
  id: number;
  routeId: string;
  year: number;
  vesselType: string;
  fuelType: string;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  ghgIntensity: number;
  isBaseline: boolean;
}

export default function RoutesPage() {
  const [allRoutes, setAllRoutes] = useState<Route[]>([]); // Store all routes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }>({});

  const [vesselTypes, setVesselTypes] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [settingBaseline, setSettingBaseline] = useState<number | null>(null); // Track which route is being set as baseline

  // Load all routes once on mount
  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRoutes(); // Fetch all routes without filters

      setAllRoutes(data);

      // Extract unique values for filters
      const uniqueVesselTypes = [...new Set(data.map((r: Route) => r.vesselType))].sort();
      const uniqueFuelTypes = [...new Set(data.map((r: Route) => r.fuelType))].sort();
      const uniqueYears = [...new Set(data.map((r: Route) => r.year))].sort((a, b) => b - a);

      setVesselTypes(uniqueVesselTypes);
      setFuelTypes(uniqueFuelTypes);
      setYears(uniqueYears);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load routes";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Load routes once on mount
  useEffect(() => {
    void loadRoutes();
  }, []);

  // Filter routes on the client side (instant, no API calls)
  const filteredRoutes = allRoutes.filter((route) => {
    if (filters.vesselType && route.vesselType !== filters.vesselType) return false;
    if (filters.fuelType && route.fuelType !== filters.fuelType) return false;
    if (filters.year && route.year !== filters.year) return false;
    return true;
  });

  const handleSetBaseline = async (routeId: number) => {
    try {
      setSettingBaseline(routeId); // Start loading state
      const result = await api.setBaseline(routeId);
      toast.success(result.message || "Baseline updated successfully");
      
      // Optimistic update: Update local state immediately
      setAllRoutes(prevRoutes => 
        prevRoutes.map(r => ({
          ...r,
          isBaseline: r.id === routeId
        }))
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to set baseline";
      toast.error(errorMsg);
      // Revert on error
      await loadRoutes();
    } finally {
      setSettingBaseline(null); // Clear loading state
    }
  };

  if (loading && allRoutes.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = filters.vesselType || filters.fuelType || filters.year;

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <TooltipProvider>
        <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 relative ${settingBaseline !== null ? 'overflow-hidden' : ''}`}>
          {/* Loading Overlay */}
          {settingBaseline !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[280px]">
                <div className="relative">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">Setting Baseline</p>
                  <p className="text-sm text-gray-600 mt-1">Please wait...</p>
                </div>
              </div>
            </div>
          )}
          <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <IconRoute className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Routes Management</h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    View and manage all shipping routes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{filteredRoutes.length}</span>
                <span>{filteredRoutes.length === allRoutes.length ? 'routes' : `of ${allRoutes.length} routes`}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconFilter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Filters</span>
                  {hasActiveFilters && (
                    <span className="text-xs text-gray-500">({filteredRoutes.length} results)</span>
                  )}
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    disabled={settingBaseline !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white rounded-lg border border-gray-300 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IconFilterOff className="w-3.5 h-3.5" />
                    Clear Filters
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Vessel Type
                  </label>
                  <select
                    value={filters.vesselType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, vesselType: e.target.value === "" ? undefined : e.target.value })
                    }
                    disabled={settingBaseline !== null}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">All Vessel Types</option>
                    {vesselTypes.map((vt) => (
                      <option key={vt} value={vt}>
                        {vt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Fuel Type
                  </label>
                  <select
                    value={filters.fuelType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, fuelType: e.target.value === "" ? undefined : e.target.value })
                    }
                    disabled={settingBaseline !== null}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">All Fuel Types</option>
                    {fuelTypes.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Year
                  </label>
                  <select
                    value={filters.year ?? ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        year: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Years</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ship ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Route ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Vessel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      GHG Intensity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Consumption
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Emissions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <IconFilter className="w-12 h-12 text-gray-300" />
                          <p className="text-sm font-medium">No routes found</p>
                          <p className="text-xs">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes.map((route) => (
                    <tr
                      key={route.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        route.isBaseline ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{route.routeId}</span>
                          {route.isBaseline && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Baseline
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.vesselType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {route.ghgIntensity.toFixed(2)} <span className="text-xs text-gray-500">gCO₂e/MJ</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelConsumption.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.distance.toLocaleString()} <span className="text-xs text-gray-500">km</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.totalEmissions.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!route.isBaseline && (
                          <button
                            onClick={() => handleSetBaseline(route.id)}
                            disabled={settingBaseline !== null}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                          >
                            {settingBaseline === route.id ? (
                              <span className="flex items-center gap-2">
                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
                                Setting...
                              </span>
                            ) : (
                              "Set Baseline"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}

```

```typescriptreact
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { IconInfoCircle, IconRoute, IconFilter, IconFilterOff } from "@tabler/icons-react";

interface Route {
  id: number;
  routeId: string;
  year: number;
  vesselType: string;
  fuelType: string;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  ghgIntensity: number;
  isBaseline: boolean;
}

export default function RoutesPage() {
  const [allRoutes, setAllRoutes] = useState<Route[]>([]); // Store all routes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }>({});

  const [vesselTypes, setVesselTypes] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [settingBaseline, setSettingBaseline] = useState<number | null>(null); // Track which route is being set as baseline

  // Load all routes once on mount
  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRoutes(); // Fetch all routes without filters

      setAllRoutes(data);

      // Extract unique values for filters
      const uniqueVesselTypes = [...new Set(data.map((r: Route) => r.vesselType))].sort();
      const uniqueFuelTypes = [...new Set(data.map((r: Route) => r.fuelType))].sort();
      const uniqueYears = [...new Set(data.map((r: Route) => r.year))].sort((a, b) => b - a);

      setVesselTypes(uniqueVesselTypes);
      setFuelTypes(uniqueFuelTypes);
      setYears(uniqueYears);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load routes";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Load routes once on mount
  useEffect(() => {
    void loadRoutes();
  }, []);

  // Filter routes on the client side (instant, no API calls)
  const filteredRoutes = allRoutes.filter((route) => {
    if (filters.vesselType && route.vesselType !== filters.vesselType) return false;
    if (filters.fuelType && route.fuelType !== filters.fuelType) return false;
    if (filters.year && route.year !== filters.year) return false;
    return true;
  });

  const handleSetBaseline = async (routeId: number) => {
    try {
      setSettingBaseline(routeId); // Start loading state
      const result = await api.setBaseline(routeId);
      toast.success(result.message || "Baseline updated successfully");
      
      // Optimistic update: Update local state immediately
      setAllRoutes(prevRoutes => 
        prevRoutes.map(r => ({
          ...r,
          isBaseline: r.id === routeId
        }))
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to set baseline";
      toast.error(errorMsg);
      // Revert on error
      await loadRoutes();
    } finally {
      setSettingBaseline(null); // Clear loading state
    }
  };

  if (loading && allRoutes.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = filters.vesselType || filters.fuelType || filters.year;

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <TooltipProvider>
        <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 relative ${settingBaseline !== null ? 'overflow-hidden' : ''}`}>
          {/* Loading Overlay */}
          {settingBaseline !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[280px]">
                <div className="relative">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">Setting Baseline</p>
                  <p className="text-sm text-gray-600 mt-1">Please wait...</p>
                </div>
              </div>
            </div>
          )}
          <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <IconRoute className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Routes Management</h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    View and manage all shipping routes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{filteredRoutes.length}</span>
                <span>{filteredRoutes.length === allRoutes.length ? 'routes' : `of ${allRoutes.length} routes`}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconFilter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Filters</span>
                  {hasActiveFilters && (
                    <span className="text-xs text-gray-500">({filteredRoutes.length} results)</span>
                  )}
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    disabled={settingBaseline !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white rounded-lg border border-gray-300 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IconFilterOff className="w-3.5 h-3.5" />
                    Clear Filters
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Vessel Type
                  </label>
                  <select
                    value={filters.vesselType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, vesselType: e.target.value === "" ? undefined : e.target.value })
                    }
                    disabled={settingBaseline !== null}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">All Vessel Types</option>
                    {vesselTypes.map((vt) => (
                      <option key={vt} value={vt}>
                        {vt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Fuel Type
                  </label>
                  <select
                    value={filters.fuelType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, fuelType: e.target.value === "" ? undefined : e.target.value })
                    }
                    disabled={settingBaseline !== null}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">All Fuel Types</option>
                    {fuelTypes.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Year
                  </label>
                  <select
                    value={filters.year ?? ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        year: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    disabled={settingBaseline !== null}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">All Years</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ship ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Route ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Vessel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      GHG Intensity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Consumption
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Emissions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <IconFilter className="w-12 h-12 text-gray-300" />
                          <p className="text-sm font-medium">No routes found</p>
                          <p className="text-xs">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes.map((route) => (
                    <tr
                      key={route.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        route.isBaseline ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{route.routeId}</span>
                          {route.isBaseline && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Baseline
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.vesselType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {route.ghgIntensity.toFixed(2)} <span className="text-xs text-gray-500">gCO₂e/MJ</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelConsumption.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.distance.toLocaleString()} <span className="text-xs text-gray-500">km</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.totalEmissions.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!route.isBaseline && (
                          <button
                            onClick={() => handleSetBaseline(route.id)}
                            disabled={settingBaseline !== null}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                          >
                            {settingBaseline === route.id ? (
                              <span className="flex items-center gap-2">
                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
                                Setting...
                              </span>
                            ) : (
                              "Set Baseline"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}

```


Added a loading state for the "Set Baseline" action.

## Changes Made:

1. **Loading state tracking**: Added `settingBaseline` state to track which route is being set as baseline

2. **Full-screen overlay with blur**:
   - Fixed overlay covering the entire screen
   - Backdrop blur effect (`backdrop-blur-sm`)
   - Semi-transparent dark background (`bg-black/20`)
   - Centered loading modal with spinner and message

3. **Disabled interactions**:
   - All "Set Baseline" buttons are disabled during loading
   - All filter dropdowns (Vessel Type, Fuel Type, Year) are disabled
   - "Clear Filters" button is disabled
   - The active button shows a spinner and "Setting..." text

4. **Loading indicator**:
   - Large spinner in the center modal
   - "Setting Baseline" message
   - "Please wait..." subtitle

5. **Promise handling**:
   - Loading state starts when the button is clicked
   - Loading state clears in the `finally` block after the promise resolves
   - Success/error toasts still work as before

When you click "Set Baseline":
- The background blurs and darkens
- A loading modal appears in the center
- All interactions are disabled
- The button shows a loading spinner
- Everything returns to normal when the API call completes

The implementation ensures users can't interact with the page while the baseline is being set, providing clear visual feedback.

---

**User**

there is a major bug that i discovered that is basecb doesnt change that is fine it shouldnt but lets say base cb is 8000 and i select a amount 4000 i can enter 4000 three times  i can exceed the amount banked than normal like the user shouldnt be able to bank more than its current base i dont think the backend route and application logic prevent against it

---

**Cursor**


Checking the banking logic. The issue is likely in how we calculate the already-banked amount for validation. Reviewing the implementation:



The issue: `getBankedAmount` returns the net amount (positive - negative), but for banking validation we need the total amount banked (sum of positive entries only). Adding a method to get the total banked amount and updating the validation:


```typescript
// src/core/ports/BankRepositoryPort.ts
import type { BankEntryEntity } from "../domain/BankEntryEntity.js";

export interface BankRepositoryPort {
  getBankedAmount(shipId: string, year: number): Promise<number>; // Returns net amount (positive - negative) for applying
  getTotalBankedAmount(shipId: string, year: number): Promise<number>; // Returns total amount banked (sum of positive entries only) for validation
  getBankRecords(shipId: string, year: number): Promise<BankEntryEntity[]>;
  bankSurplus(shipId: string, year: number, amount: number): Promise<BankEntryEntity>;
  applyBanked(shipId: string, year: number, amount: number): Promise<BankEntryEntity>;
}


```

```typescript
// src/adapters/outbound/postgres/PrismaBankRepository.ts
import { prisma } from "../../../infrastructure/db/prisma.js";
import type { BankRepositoryPort } from "../../../core/ports/BankRepositoryPort.js";
import type { BankEntryEntity } from "../../../core/domain/BankEntryEntity.js";

export class PrismaBankRepository implements BankRepositoryPort {
  async getBankedAmount(shipId: string, year: number): Promise<number> {
    // Get all entries (both positive for banking and negative for applying)
    const entries = await prisma.bankEntry.findMany({
      where: { shipId, year },
    });
    // Sum all entries: positive entries (banking) - negative entries (applying)
    // This gives the net banked amount available (for applying banked surplus)
    return entries.reduce((sum, entry) => sum + entry.amountGco2eq, 0);
  }

  async getTotalBankedAmount(shipId: string, year: number): Promise<number> {
    // Get only positive entries (banking operations)
    const entries = await prisma.bankEntry.findMany({
      where: { 
        shipId, 
        year,
        amountGco2eq: { gt: 0 } // Only positive entries (banking operations)
      },
    });
    // Sum only positive entries to get total amount banked
    // This is used for validation: you can't bank more than Base CB - Total Banked
    return entries.reduce((sum, entry) => sum + entry.amountGco2eq, 0);
  }

  async getBankRecords(shipId: string, year: number): Promise<BankEntryEntity[]> {
    return prisma.bankEntry.findMany({
      where: { shipId, year },
    });
  }

  async bankSurplus(shipId: string, year: number, amount: number): Promise<BankEntryEntity> {
    if (amount <= 0) {
      throw new Error("Amount must be positive to bank surplus");
    }
    return prisma.bankEntry.create({
      data: {
        shipId,
        year,
        amountGco2eq: amount,
      },
    });
  }

  async applyBanked(shipId: string, year: number, amount: number): Promise<BankEntryEntity> {
    if (amount <= 0) {
      throw new Error("Amount must be positive to apply banked surplus");
    }
    // Create a negative entry to represent applying banked surplus
    return prisma.bankEntry.create({
      data: {
        shipId,
        year,
        amountGco2eq: -amount, // Negative to represent application
      },
    });
  }
}


```

```typescript
// src/core/application/BankSurplus.ts
import type { ComplianceRepositoryPort } from "../ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../ports/BankRepositoryPort.js";

/**
 * Bank surplus according to Article 20 of FuelEU Maritime Regulation.
 * 
 * Banking surplus moves available CB to banked storage for future use.
 * The base CB (calculated from routes) remains unchanged, but the available
 * CB for banking is reduced by the amount already banked.
 * 
 * Key rule: You can only bank what's available = Base CB - Already Banked Amount
 * This prevents double-banking the same surplus multiple times.
 */
export async function bankSurplus(
  complianceRepo: ComplianceRepositoryPort,
  bankRepo: BankRepositoryPort,
  shipId: string,
  year: number,
  amount: number
) {
  // Get base CB (calculated from routes, never changes)
  const baseCB = await complianceRepo.getCB(shipId, year);
  if (!baseCB) {
    throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
  }

  // Only bank if base CB is positive (surplus)
  if (baseCB.cbGco2eq <= 0) {
    throw new Error(`Cannot bank: Compliance Balance (${baseCB.cbGco2eq}) is not positive`);
  }

  // Validate amount
  if (amount <= 0) {
    throw new Error(`Amount must be positive`);
  }

  // Get total amount banked (sum of positive entries only)
  // This is different from getBankedAmount which returns net (positive - negative)
  // For validation, we need to know how much has been banked total, regardless of applications
  const totalBanked = await bankRepo.getTotalBankedAmount(shipId, year);
  
  // Calculate available CB for banking = Base CB - Total Banked
  // This ensures we can't bank more than what's actually available
  // Example: Base CB = 8000, Banked 4000, Available = 4000 (can't bank more than 4000)
  const availableCB = baseCB.cbGco2eq - totalBanked;
  
  if (availableCB <= 0) {
    throw new Error(`No available surplus to bank. Base CB: ${baseCB.cbGco2eq}, Already banked: ${alreadyBanked}`);
  }

  if (amount > availableCB) {
    throw new Error(
      `Cannot bank ${amount}: only ${availableCB} available ` +
      `(Base CB: ${baseCB.cbGco2eq}, Already banked: ${alreadyBanked})`
    );
  }
  
  // Bank the specified amount (creates positive entry)
  await bankRepo.bankSurplus(shipId, year, amount);

  // Base CB remains unchanged (it's calculated from routes)
  // But the available CB for future banking is now reduced by 'amount'
  // Available CB after banking = baseCB - (alreadyBanked + amount)

  return {
    shipId,
    year,
    cbBefore: baseCB.cbGco2eq,
    availableBefore: availableCB,
    banked: amount,
    availableAfter: availableCB - amount,
    cbAfter: baseCB.cbGco2eq, // Base CB unchanged
  };
}


```

```typescript
// src/core/application/BankSurplus.ts
import type { ComplianceRepositoryPort } from "../ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../ports/BankRepositoryPort.js";

/**
 * Bank surplus according to Article 20 of FuelEU Maritime Regulation.
 * 
 * Banking surplus moves available CB to banked storage for future use.
 * The base CB (calculated from routes) remains unchanged, but the available
 * CB for banking is reduced by the amount already banked.
 * 
 * Key rule: You can only bank what's available = Base CB - Already Banked Amount
 * This prevents double-banking the same surplus multiple times.
 */
export async function bankSurplus(
  complianceRepo: ComplianceRepositoryPort,
  bankRepo: BankRepositoryPort,
  shipId: string,
  year: number,
  amount: number
) {
  // Get base CB (calculated from routes, never changes)
  const baseCB = await complianceRepo.getCB(shipId, year);
  if (!baseCB) {
    throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
  }

  // Only bank if base CB is positive (surplus)
  if (baseCB.cbGco2eq <= 0) {
    throw new Error(`Cannot bank: Compliance Balance (${baseCB.cbGco2eq}) is not positive`);
  }

  // Validate amount
  if (amount <= 0) {
    throw new Error(`Amount must be positive`);
  }

  // Get total amount banked (sum of positive entries only)
  // This is different from getBankedAmount which returns net (positive - negative)
  // For validation, we need to know how much has been banked total, regardless of applications
  const totalBanked = await bankRepo.getTotalBankedAmount(shipId, year);
  
  // Calculate available CB for banking = Base CB - Total Banked
  // This ensures we can't bank more than what's actually available
  // Example: Base CB = 8000, Banked 4000, Available = 4000 (can't bank more than 4000)
  const availableCB = baseCB.cbGco2eq - totalBanked;
  
  if (availableCB <= 0) {
    throw new Error(
      `No available surplus to bank. Base CB: ${baseCB.cbGco2eq}, Total banked: ${totalBanked}`
    );
  }

  if (amount > availableCB) {
    throw new Error(
      `Cannot bank ${amount}: only ${availableCB} available ` +
      `(Base CB: ${baseCB.cbGco2eq}, Total banked: ${totalBanked})`
    );
  }
  
  // Bank the specified amount (creates positive entry)
  await bankRepo.bankSurplus(shipId, year, amount);

  // Base CB remains unchanged (it's calculated from routes)
  // But the available CB for future banking is now reduced by 'amount'
  // Available CB after banking = baseCB - (alreadyBanked + amount)

  return {
    shipId,
    year,
    cbBefore: baseCB.cbGco2eq,
    availableBefore: availableCB,
    banked: amount,
    availableAfter: availableCB - amount,
    cbAfter: baseCB.cbGco2eq, // Base CB unchanged
  };
}


```


Fixing a leftover reference in the return statement:


```typescript
// src/core/application/BankSurplus.ts
import type { ComplianceRepositoryPort } from "../ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../ports/BankRepositoryPort.js";

/**
 * Bank surplus according to Article 20 of FuelEU Maritime Regulation.
 * 
 * Banking surplus moves available CB to banked storage for future use.
 * The base CB (calculated from routes) remains unchanged, but the available
 * CB for banking is reduced by the amount already banked.
 * 
 * Key rule: You can only bank what's available = Base CB - Already Banked Amount
 * This prevents double-banking the same surplus multiple times.
 */
export async function bankSurplus(
  complianceRepo: ComplianceRepositoryPort,
  bankRepo: BankRepositoryPort,
  shipId: string,
  year: number,
  amount: number
) {
  // Get base CB (calculated from routes, never changes)
  const baseCB = await complianceRepo.getCB(shipId, year);
  if (!baseCB) {
    throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
  }

  // Only bank if base CB is positive (surplus)
  if (baseCB.cbGco2eq <= 0) {
    throw new Error(`Cannot bank: Compliance Balance (${baseCB.cbGco2eq}) is not positive`);
  }

  // Validate amount
  if (amount <= 0) {
    throw new Error(`Amount must be positive`);
  }

  // Get total amount banked (sum of positive entries only)
  // This is different from getBankedAmount which returns net (positive - negative)
  // For validation, we need to know how much has been banked total, regardless of applications
  const totalBanked = await bankRepo.getTotalBankedAmount(shipId, year);
  
  // Calculate available CB for banking = Base CB - Total Banked
  // This ensures we can't bank more than what's actually available
  // Example: Base CB = 8000, Banked 4000, Available = 4000 (can't bank more than 4000)
  const availableCB = baseCB.cbGco2eq - totalBanked;
  
  if (availableCB <= 0) {
    throw new Error(
      `No available surplus to bank. Base CB: ${baseCB.cbGco2eq}, Total banked: ${totalBanked}`
    );
  }

  if (amount > availableCB) {
    throw new Error(
      `Cannot bank ${amount}: only ${availableCB} available ` +
      `(Base CB: ${baseCB.cbGco2eq}, Total banked: ${totalBanked})`
    );
  }
  
  // Bank the specified amount (creates positive entry)
  await bankRepo.bankSurplus(shipId, year, amount);

  // Base CB remains unchanged (it's calculated from routes)
  // But the available CB for future banking is now reduced by 'amount'
  // Available CB after banking = baseCB - (alreadyBanked + amount)

  return {
    shipId,
    year,
    cbBefore: baseCB.cbGco2eq,
    totalBankedBefore: totalBanked,
    availableBefore: availableCB,
    banked: amount,
    totalBankedAfter: totalBanked + amount,
    availableAfter: availableCB - amount,
    cbAfter: baseCB.cbGco2eq, // Base CB unchanged
  };
}


```


Updating the comment that still references the old variable:


```typescript
// src/core/application/BankSurplus.ts
import type { ComplianceRepositoryPort } from "../ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../ports/BankRepositoryPort.js";

/**
 * Bank surplus according to Article 20 of FuelEU Maritime Regulation.
 * 
 * Banking surplus moves available CB to banked storage for future use.
 * The base CB (calculated from routes) remains unchanged, but the available
 * CB for banking is reduced by the amount already banked.
 * 
 * Key rule: You can only bank what's available = Base CB - Already Banked Amount
 * This prevents double-banking the same surplus multiple times.
 */
export async function bankSurplus(
  complianceRepo: ComplianceRepositoryPort,
  bankRepo: BankRepositoryPort,
  shipId: string,
  year: number,
  amount: number
) {
  // Get base CB (calculated from routes, never changes)
  const baseCB = await complianceRepo.getCB(shipId, year);
  if (!baseCB) {
    throw new Error(`No compliance balance found for ship ${shipId} in year ${year}`);
  }

  // Only bank if base CB is positive (surplus)
  if (baseCB.cbGco2eq <= 0) {
    throw new Error(`Cannot bank: Compliance Balance (${baseCB.cbGco2eq}) is not positive`);
  }

  // Validate amount
  if (amount <= 0) {
    throw new Error(`Amount must be positive`);
  }

  // Get total amount banked (sum of positive entries only)
  // This is different from getBankedAmount which returns net (positive - negative)
  // For validation, we need to know how much has been banked total, regardless of applications
  const totalBanked = await bankRepo.getTotalBankedAmount(shipId, year);
  
  // Calculate available CB for banking = Base CB - Total Banked
  // This ensures we can't bank more than what's actually available
  // Example: Base CB = 8000, Banked 4000, Available = 4000 (can't bank more than 4000)
  const availableCB = baseCB.cbGco2eq - totalBanked;
  
  if (availableCB <= 0) {
    throw new Error(
      `No available surplus to bank. Base CB: ${baseCB.cbGco2eq}, Total banked: ${totalBanked}`
    );
  }

  if (amount > availableCB) {
    throw new Error(
      `Cannot bank ${amount}: only ${availableCB} available ` +
      `(Base CB: ${baseCB.cbGco2eq}, Total banked: ${totalBanked})`
    );
  }
  
  // Bank the specified amount (creates positive entry)
  await bankRepo.bankSurplus(shipId, year, amount);

  // Base CB remains unchanged (it's calculated from routes)
  // But the available CB for future banking is now reduced by 'amount'
  // Available CB after banking = baseCB - (totalBanked + amount)

  return {
    shipId,
    year,
    cbBefore: baseCB.cbGco2eq,
    totalBankedBefore: totalBanked,
    availableBefore: availableCB,
    banked: amount,
    totalBankedAfter: totalBanked + amount,
    availableAfter: availableCB - amount,
    cbAfter: baseCB.cbGco2eq, // Base CB unchanged
  };
}


```


## The Bug

The issue was using `getBankedAmount()` (net: positive - negative) for banking validation. This allowed banking more than the base CB when some banked amount was applied.

**Example of the bug:**
- Base CB = 8000
- Bank 4000 → total banked = 4000, net = 4000
- Apply 2000 → total banked = 4000, net = 2000
- Try to bank 4000 again → validation used net (2000), so available = 8000 - 2000 = 6000 → incorrectly allowed

## The Fix

1. Added `getTotalBankedAmount()` method:
   - Returns the sum of positive entries only (total amount banked)
   - Used for banking validation

2. Updated `BankSurplus` validation:
   - Uses `getTotalBankedAmount()` instead of `getBankedAmount()`
   - Calculates: `availableCB = baseCB - totalBanked`
   - Prevents banking more than the base CB

3. Kept `getBankedAmount()` for applying:
   - Still returns net amount (positive - negative)
   - Used for applying banked surplus

## How It Works Now

**Scenario: Base CB = 8000**
1. Bank 4000 → totalBanked = 4000, available = 4000 ✓
2. Bank 4000 again → totalBanked = 8000, available = 0 → FAILS ✓
3. Cannot exceed base CB

**Even if you apply some:**
1. Bank 4000 → totalBanked = 4000
2. Apply 2000 → totalBanked still = 4000 (for validation)
3. Try to bank 4000 again → totalBanked = 4000, available = 4000 → only 4000 can be banked ✓

The backend now prevents banking more than the base CB.

---

**User**

could you seed the database again with fresh data i have corrupted it using invalid enries now it has bogus data 

---

**Cursor**


Checking the seed file and database setup to reseed with fresh data:



The seed file already clears existing data before inserting fresh data. Running the seed command to reset the database:



Database reseeded successfully.

The seed script:
1. Cleared all existing data (pools, bank entries, compliance records, routes)
2. Inserted fresh routes:
   - **R001** - Container, HFO, 2024 (set as baseline)
   - **R002** - BulkCarrier, LNG, 2024
   - **R003** - Tanker, MGO, 2024
   - **R004** - RoRo, HFO, 2025
   - **R005** - Container, LNG, 2025

The database is now clean with only the seed data. Invalid entries have been removed. You can test banking, compliance, and pooling with these routes.

Note: The seed file automatically clears all data before inserting, so running `npm run seed` always gives you a fresh start.

---

**User**

not this data it has only 5 entries i want it like before only 50 fresh entires the one i was using before

---

**Cursor**


Checking for a previous seed file with more entries, or updating the seed to generate 50 routes:



Updating the seed file to generate 50 routes with varied data:


```typescript
// prisma/seed.ts
import "../src/config/env.js";
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("🌱 Starting seed...");

  // Clear existing data
  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.bankEntry.deleteMany();
  await prisma.shipCompliance.deleteMany();
  await prisma.route.deleteMany();
  console.log("✅ Cleared existing data");

  // Vessel types and fuel types for realistic data
  const vesselTypes = ["Container", "BulkCarrier", "Tanker", "RoRo", "GeneralCargo", "Passenger"];
  const fuelTypes = ["HFO", "LNG", "MGO", "LSFO", "Biofuel"];
  const years = [2024, 2025, 2026];

  // Generate 50 routes
  const routes = [];
  
  for (let i = 1; i <= 50; i++) {
    const vesselType = faker.helpers.arrayElement(vesselTypes);
    const fuelType = faker.helpers.arrayElement(fuelTypes);
    const year = faker.helpers.arrayElement(years);
    
    // Generate realistic values
    const fuelConsumption = faker.number.int({ min: 3000, max: 8000 }); // tons
    const distance = faker.number.int({ min: 8000, max: 20000 }); // km
    
    // GHG intensity varies by fuel type (realistic ranges)
    let ghgIntensity: number;
    switch (fuelType) {
      case "LNG":
        ghgIntensity = faker.number.float({ min: 85.0, max: 92.0, fractionDigits: 1 });
        break;
      case "MGO":
        ghgIntensity = faker.number.float({ min: 90.0, max: 95.0, fractionDigits: 1 });
        break;
      case "LSFO":
        ghgIntensity = faker.number.float({ min: 88.0, max: 93.0, fractionDigits: 1 });
        break;
      case "Biofuel":
        ghgIntensity = faker.number.float({ min: 75.0, max: 85.0, fractionDigits: 1 });
        break;
      default: // HFO
        ghgIntensity = faker.number.float({ min: 90.0, max: 95.0, fractionDigits: 1 });
    }
    
    // Calculate total emissions (simplified: fuelConsumption * emissions factor)
    // Using approximate factor of 0.9-1.0 tCO2 per ton of fuel
    const emissionsFactor = faker.number.float({ min: 0.85, max: 1.0, fractionDigits: 2 });
    const totalEmissions = Math.round(fuelConsumption * emissionsFactor);
    
    routes.push({
      routeId: `R${String(i).padStart(3, "0")}`,
      vesselType,
      fuelType,
      year,
      ghgIntensity,
      fuelConsumption,
      distance,
      totalEmissions,
      isBaseline: i === 1, // Set first route as baseline
    });
  }

  await prisma.route.createMany({ data: routes });
  console.log(`✅ Inserted ${routes.length} Routes (R001-R${String(routes.length).padStart(3, "0")})`);

  console.log("🌿 Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Error seeding database:", error);
    await prisma.$disconnect();
    process.exit(1);
  });

```


Database reseeded with 50 fresh routes.

The seed file now generates:
- 50 routes (R001–R050)
- Varied vessel types: Container, BulkCarrier, Tanker, RoRo, GeneralCargo, Passenger
- Varied fuel types: HFO, LNG, MGO, LSFO, Biofuel
- Years: 2024, 2025, 2026
- Realistic values:
  - Fuel consumption: 3,000–8,000 tons
  - Distance: 8,000–20,000 km
  - GHG intensity varies by fuel type
  - Total emissions calculated from fuel consumption

R001 is set as the baseline route.

The database is ready with 50 routes for testing banking, compliance, and pooling.

